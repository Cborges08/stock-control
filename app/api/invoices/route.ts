import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { InvoicePayloadSchema } from '@/lib/validators/invoice'
import { validateCnpj } from '@/lib/validators/cnpj'
import { validateNfeKey } from '@/lib/validators/nfe'
import type { CreateInvoiceResult } from '@/lib/types'

export async function POST(request: Request) {
  // 1. Auth guard (D-07, D-08: getUser() + admin role check)
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json(
      { code: 'unauthorized', message: 'Autenticacao necessaria' },
      { status: 401 }
    )
  }

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'admin') {
    return NextResponse.json(
      { code: 'forbidden', message: 'Acesso restrito a administradores' },
      { status: 403 }
    )
  }

  // 2. Parse JSON body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { code: 'validation_error', message: 'Corpo da requisicao invalido (JSON malformado)' },
      { status: 400 }
    )
  }

  // 3. Zod schema validation
  const parsed = InvoicePayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      {
        code: 'validation_error',
        message: firstIssue?.message ?? 'Payload invalido',
        path: firstIssue?.path,
      },
      { status: 400 }
    )
  }
  const payload = parsed.data

  // 4. CNPJ Módulo-11 validation (D-03: strip formatting, D-04: check digit)
  const cnpjDigits = payload.supplier.cnpj.replace(/\D/g, '')
  if (!validateCnpj(cnpjDigits)) {
    return NextResponse.json(
      { code: 'cnpj_invalid', message: 'CNPJ do fornecedor invalido' },
      { status: 400 }
    )
  }

  // 5. NF-e key semantic validation (cUF range + cDV Módulo-11)
  if (!validateNfeKey(payload.invoice.nfe_key)) {
    return NextResponse.json(
      { code: 'validation_error', message: 'Chave de acesso NF-e invalida' },
      { status: 400 }
    )
  }

  // 6. Pre-flight nfe_key duplicate check (D-10: uses server.ts client, SELECT via RLS)
  // Note: lookupError is logged but does not abort — the RPC's own DUPLICATE_NFE_KEY guard
  // is the authoritative duplicate check. Pre-flight is defense-in-depth only.
  const { data: existing, error: lookupError } = await supabase
    .from('invoice_headers')
    .select('id')
    .eq('nfe_key', payload.invoice.nfe_key)
    .maybeSingle()

  if (lookupError) {
    console.warn('[POST /api/invoices] pre-flight lookup failed:', lookupError.code)
  }

  if (existing) {
    return NextResponse.json(
      { code: 'nfe_key_duplicate', message: 'NF-e ja registrada' },
      { status: 409 }
    )
  }

  // 7. Call fn_create_invoice RPC (D-01: supplier as full object, D-02: items with product_id)
  // Note on p_items: Zod .optional() fields produce T | undefined. When the Supabase client
  // serializes p_items to JSONB, undefined values are omitted from each object. In PostgreSQL
  // JSONB, missing keys resolve to NULL — this is functionally equivalent to explicit null.
  // fn_create_invoice uses COALESCE/nullable access on these fields, so omission is safe.
  // This is intentionally inconsistent with the explicit `?? null` on p_supplier/p_invoice
  // scalar fields, which are passed as a flat JSONB object where key presence matters more.
  const { data, error } = await supabase.rpc('fn_create_invoice', {
    p_supplier: {
      cnpj: cnpjDigits,
      name: payload.supplier.name,
      ie: payload.supplier.ie ?? null,
      address: payload.supplier.address ?? null,
      phone: payload.supplier.phone ?? null,
    },
    p_invoice: {
      nfe_number: payload.invoice.nfe_number,
      nfe_serie: payload.invoice.nfe_serie,
      nfe_key: payload.invoice.nfe_key,
      emission_date: payload.invoice.emission_date,
      total_value: payload.invoice.total_value,
      protocol: payload.invoice.protocol ?? null,
      exit_date: payload.invoice.exit_date ?? null,
      natureza_operacao: payload.invoice.natureza_operacao ?? null,
      raw_data: payload.invoice.raw_data ?? null,
    },
    p_items: payload.items,
  })

  // 8. Handle RPC errors
  if (error) {
    // Race-condition fallback: RPC's own DUPLICATE_NFE_KEY guard
    // Exact RAISE EXCEPTION in fn_create_invoice (migration 20260407000010):
    //   'DUPLICATE_NFE_KEY: NF-e ja registrada com esta chave de acesso'
    if (error.message?.startsWith('DUPLICATE_NFE_KEY')) {
      return NextResponse.json(
        { code: 'nfe_key_duplicate', message: 'NF-e ja registrada' },
        { status: 409 }
      )
    }
    // FK violation: bad product_id (D-09: catch and return 400)
    // Note: error.details may contain internal schema info (e.g. table/column names).
    // This is acceptable — POST /api/invoices is an admin-only endpoint; leaking
    // FK details to authenticated admins is an intentional tradeoff for debuggability.
    if (error.code === '23503') {
      return NextResponse.json(
        { code: 'product_not_found', message: 'Produto nao encontrado no sistema', details: error.details },
        { status: 400 }
      )
    }
    // Generic DB error
    console.error('[POST /api/invoices] RPC error:', error)
    return NextResponse.json(
      { code: 'internal_error', message: 'Erro interno ao registrar NF-e' },
      { status: 500 }
    )
  }

  // 9. Null-guard: Supabase RPC can return null data without an error in edge cases
  // (e.g. future DB bug, RETURN NULL path). Guard before type cast to prevent uncaught
  // property access on null producing an unstructured 500.
  if (!data) {
    console.error('[POST /api/invoices] RPC returned null without error')
    return NextResponse.json(
      { code: 'internal_error', message: 'Erro interno' },
      { status: 500 }
    )
  }

  // 10. Re-shape response: exclude supplier_id from RPC result (information disclosure prevention)
  const rpcResult = data as {
    invoice_id: string
    supplier_id: string
    batch_ids: string[]
    movement_ids: string[]
  }
  const result: CreateInvoiceResult = {
    invoice_id: rpcResult.invoice_id,
    batch_ids: rpcResult.batch_ids,
    movement_ids: rpcResult.movement_ids,
  }

  return NextResponse.json(result, { status: 201 })
}
