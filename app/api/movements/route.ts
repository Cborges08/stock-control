import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MovementPayloadSchema } from '@/lib/validators/movement'
import type { CreateMovementResult } from '@/lib/types'

export async function POST(request: Request) {
  // 1. Auth guard (D-01: getUser(), no role check — any authenticated user)
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json(
      { code: 'unauthorized', message: 'Autenticacao necessaria' },
      { status: 401 }
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
  const parsed = MovementPayloadSchema.safeParse(rawBody)
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

  // 4. RPC call (D-02: user_id always from server getUser(), never from request body)
  const { data, error } = await supabase.rpc('fn_create_movement', {
    p_product_id: payload.product_id,
    p_quantity: payload.quantity,
    p_user_id: user.id,
    p_reason: payload.reason ?? undefined,
  })

  // 5. Error mapping (D-04)
  if (error) {
    if (error.message?.startsWith('PRODUCT_NOT_FOUND')) {
      return NextResponse.json(
        { code: 'product_not_found', message: 'Produto nao encontrado' },
        { status: 404 }
      )
    }

    if (error.message?.startsWith('PRODUCT_ARCHIVED')) {
      return NextResponse.json(
        { code: 'product_archived', message: 'Produto arquivado, retirada nao permitida' },
        { status: 409 }
      )
    }

    if (error.message?.startsWith('BATCH_NOT_FOUND')) {
      return NextResponse.json(
        { code: 'batch_not_found', message: 'Nenhum lote aberto para o produto' },
        { status: 422 }
      )
    }

    if (error.message?.startsWith('INSUFFICIENT_STOCK')) {
      // D-05: extract available and requested quantities from RPC error message
      // Format: 'INSUFFICIENT_STOCK: ... Disponivel: 5.500, solicitado: 10.000'
      const match = error.message.match(/Disponivel:\s*([\d.]+),\s*solicitado:\s*([\d.]+)/)
      return NextResponse.json(
        {
          code: 'insufficient_stock',
          message: 'Estoque insuficiente',
          available: match?.[1] ? parseFloat(match[1]) : undefined,
          requested: match?.[2] ? parseFloat(match[2]) : undefined,
        },
        { status: 422 }
      )
    }

    // Generic DB error — log server-side only (T-07-05: no internal details to client)
    console.error('[POST /api/movements] RPC error:', error)
    return NextResponse.json(
      { code: 'internal_error', message: 'Erro interno ao registrar retirada' },
      { status: 500 }
    )
  }

  // 6. Null-guard: Supabase RPC can return null data without an error in edge cases
  if (!data) {
    console.error('[POST /api/movements] RPC returned null without error')
    return NextResponse.json(
      { code: 'internal_error', message: 'Erro interno' },
      { status: 500 }
    )
  }

  // 7. Success response (D-09: no parseNumeric — jsonb numerics are already JS numbers)
  const result = data as CreateMovementResult
  return NextResponse.json(result, { status: 201 })
}
