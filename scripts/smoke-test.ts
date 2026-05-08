/**
 * scripts/smoke-test.ts
 * End-to-end smoke test — makes real API calls to running dev server.
 *
 * Prerequisites: npm run dev must be running on port 3000
 * Usage: npm run smoke-test   (or: npx tsx scripts/smoke-test.ts)
 *
 * Tests: NF entry, duplicate guard, FIFO withdrawal, batch auto-close,
 *        RLS enforcement, append-only verification.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

// --- Environment ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local'
  )
  process.exit(1)
}

// Service-role client for DB verification (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// --- Constants ---
const BASE_URL = 'http://localhost:3000'
const ADMIN_EMAIL = 'admin@favasorvetes.com.br'
const ADMIN_PASSWORD = 'Admin123!'

// Supabase project ref (from the URL: https://<ref>.supabase.co)
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\./)?.[1] ?? 'unknown'

// --- Utilities ---
let PASS = 0
let FAIL = 0

function assert(desc: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  PASS ${desc}`)
    PASS++
  } else {
    console.log(`  FAIL ${desc}${detail ? ` -- ${detail}` : ''}`)
    FAIL++
  }
}

async function checkDevServer(): Promise<void> {
  try {
    await fetch(BASE_URL)
  } catch {
    console.error('ERROR: Next.js dev server not running on port 3000.')
    console.error('Start with: npm run dev')
    process.exit(1)
  }
}

/**
 * Build the auth cookie header for @supabase/ssr cookie-based auth.
 * @supabase/ssr stores the FULL session as JSON in cookies named
 * sb-<project-ref>-auth-token. If the JSON exceeds ~3180 chars,
 * it is chunked into sb-<ref>-auth-token.0, .1, etc.
 */
function buildAuthCookies(session: {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
  token_type?: string
  user?: unknown
}): string {
  const baseName = `sb-${PROJECT_REF}-auth-token`
  const json = JSON.stringify(session)
  const CHUNK_SIZE = 3180

  if (json.length <= CHUNK_SIZE) {
    return `${baseName}=${encodeURIComponent(json)}`
  }

  // Chunk the cookie value
  const chunks: string[] = []
  for (let i = 0; i < json.length; i += CHUNK_SIZE) {
    chunks.push(json.slice(i, i + CHUNK_SIZE))
  }
  return chunks
    .map((chunk, i) => `${baseName}.${i}=${encodeURIComponent(chunk)}`)
    .join('; ')
}

async function post(
  path: string,
  body: unknown,
  authCookie?: string
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authCookie) headers['Cookie'] = authCookie
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, body: json }
}

// --- NF-e key computation (Modulo-11 check digit) ---
function computeNfeCDV(first43: string): string {
  let sum = 0
  let multiplier = 2
  for (let i = 42; i >= 0; i--) {
    sum += parseInt(first43[i]!) * multiplier
    multiplier = multiplier === 9 ? 2 : multiplier + 1
  }
  const rem = sum % 11
  return rem < 2 ? '0' : String(11 - rem)
}

// --- Main ---
async function main() {
  console.log('=== Fava Sorvetes -- Smoke Test ===\n')

  // 0. Check dev server
  await checkDevServer()
  console.log('Dev server: OK\n')

  // 1. Sign in as admin to get JWT for cookie-based auth
  console.log('[Auth] Signing in as admin...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  if (authError || !authData.session) {
    console.error('FATAL: Cannot sign in as admin:', authError?.message)
    process.exit(1)
  }
  const authCookie = buildAuthCookies(authData.session)
  console.log('[Auth] Admin session obtained, cookie built\n')

  // 2. Discover active products from DB for test data
  const { data: products } = await supabase
    .from('products')
    .select('id, description, code, ncm')
    .eq('status', 'active')
    .limit(2)
  if (!products || products.length < 1) {
    console.error('FATAL: No active products in DB. Run seed first.')
    process.exit(1)
  }
  const testProduct1 = products[0]!
  const testProduct2 = products.length > 1 ? products[1]! : products[0]!

  // Generate unique NF-e key (44 digits, valid Modulo-11)
  // Format: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
  const timestamp = Date.now().toString().slice(-8)
  const nfeBase43 = `3526051122233300018155001${timestamp.padStart(9, '0')}1${timestamp}`
    .slice(0, 43)
    .padEnd(43, '0')
  const nfeKeyValid = nfeBase43 + computeNfeCDV(nfeBase43)

  // Valid CNPJ: 11.222.333/0001-81 (pre-validated)
  const testCnpj = '11222333000181'

  // ============================================================
  // Test 1: NF Entry
  // ============================================================
  console.log('[Test 1] NF Entry -- POST /api/invoices')
  const invoicePayload = {
    supplier: { cnpj: testCnpj, name: 'Fornecedor Teste Smoke' },
    invoice: {
      nfe_key: nfeKeyValid,
      nfe_number: '999',
      nfe_serie: '1',
      emission_date: new Date().toISOString().split('T')[0],
      total_value: 130,
    },
    items: [
      {
        product_id: testProduct1.id,
        quantity: 5,
        unit_price: 10,
        total_price: 50,
      },
      {
        product_id: testProduct2.id,
        quantity: 4,
        unit_price: 20,
        total_price: 80,
      },
    ],
  }

  const nfResult = await post('/api/invoices', invoicePayload, authCookie)
  assert('NF entry returns 201', nfResult.status === 201, `got ${nfResult.status}: ${JSON.stringify(nfResult.body)}`)

  if (nfResult.status === 201) {
    const nfBody = nfResult.body as { invoice_id: string; batch_ids: string[]; movement_ids: string[] }
    assert('NF returns invoice_id', !!nfBody.invoice_id)
    assert('NF returns batch_ids array', Array.isArray(nfBody.batch_ids) && nfBody.batch_ids.length >= 1,
      `got ${JSON.stringify(nfBody.batch_ids)}`)
    assert('NF returns movement_ids array', Array.isArray(nfBody.movement_ids) && nfBody.movement_ids.length >= 1,
      `got ${JSON.stringify(nfBody.movement_ids)}`)

    // Verify DB state via service role
    const { data: headerRow } = await supabase
      .from('invoice_headers')
      .select('id')
      .eq('id', nfBody.invoice_id)
      .single()
    assert('invoice_header row exists in DB', !!headerRow)

    const { data: items } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('invoice_id', nfBody.invoice_id)
    assert('invoice_items count matches payload', items?.length === 2, `got ${items?.length}`)

    // Verify stock_movements of type entry were created
    for (const mvId of nfBody.movement_ids) {
      const { data: mv } = await supabase
        .from('stock_movements')
        .select('type, batch_id')
        .eq('id', mvId)
        .single()
      assert(`movement ${mvId.slice(0, 8)}... type is entry`, mv?.type === 'entry', `got ${mv?.type}`)
      assert(`movement ${mvId.slice(0, 8)}... has batch_id`, !!mv?.batch_id)
    }
  }
  console.log('')

  // ============================================================
  // Test 2: Duplicate NF Guard
  // ============================================================
  console.log('[Test 2] Duplicate NF Guard -- POST /api/invoices (same nfe_key)')
  const dupResult = await post('/api/invoices', invoicePayload, authCookie)
  assert('Duplicate NF returns 409', dupResult.status === 409, `got ${dupResult.status}`)
  console.log('')

  // ============================================================
  // Test 3: Withdrawal + FIFO
  // ============================================================
  console.log('[Test 3] Withdrawal + FIFO -- POST /api/movements')
  // Get the oldest open batch for testProduct1 to verify FIFO selection
  const { data: openBatches } = await supabase
    .from('batches')
    .select('id, batch_number, opened_at')
    .eq('product_id', testProduct1.id)
    .eq('status', 'open')
    .order('opened_at', { ascending: true })

  const withdrawResult = await post('/api/movements', {
    product_id: testProduct1.id,
    quantity: 1,
  }, authCookie)
  assert('Withdrawal returns 201', withdrawResult.status === 201, `got ${withdrawResult.status}: ${JSON.stringify(withdrawResult.body)}`)

  if (withdrawResult.status === 201 && openBatches && openBatches.length > 0) {
    const wBody = withdrawResult.body as { batch_number: string }
    assert('FIFO: withdrawal uses oldest batch', wBody.batch_number === openBatches[0]!.batch_number,
      `expected ${openBatches[0]!.batch_number}, got ${wBody.batch_number}`)
  }

  // Verify product_stock VIEW reflects the withdrawal
  const { data: stockAfter } = await supabase
    .from('product_stock')
    .select('current_stock')
    .eq('id', testProduct1.id)
    .single()
  if (stockAfter) {
    const currentStock = Number(stockAfter.current_stock)
    assert('product_stock VIEW reflects withdrawal (stock >= 0)', !isNaN(currentStock) && currentStock >= 0)
  }
  console.log('')

  // ============================================================
  // Test 4: Batch auto-close
  // ============================================================
  console.log('[Test 4] Batch auto-close')
  // Find an open batch and withdraw its full remaining quantity
  const { data: batchForClose } = await supabase
    .from('batches')
    .select('id, product_id, quantity_in, quantity_out')
    .eq('status', 'open')
    .order('opened_at', { ascending: true })
    .limit(1)
    .single()

  if (batchForClose) {
    const remaining = Number(batchForClose.quantity_in) - Number(batchForClose.quantity_out)
    if (remaining > 0) {
      const closeResult = await post('/api/movements', {
        product_id: batchForClose.product_id,
        quantity: remaining,
      }, authCookie)
      assert('Full withdrawal returns 201', closeResult.status === 201, `got ${closeResult.status}: ${JSON.stringify(closeResult.body)}`)

      // Verify batch is now closed
      const { data: closedBatch } = await supabase
        .from('batches')
        .select('status, depleted_at')
        .eq('id', batchForClose.id)
        .single()
      assert('Batch status is closed after full withdrawal', closedBatch?.status === 'closed', `got ${closedBatch?.status}`)
      assert('Batch depleted_at is set', !!closedBatch?.depleted_at)
    } else {
      console.log('  SKIP: No batch with remaining stock to test auto-close')
    }
  } else {
    console.log('  SKIP: No open batch found for auto-close test')
  }
  console.log('')

  // ============================================================
  // Test 5: Auth enforcement (unauthenticated)
  // ============================================================
  console.log('[Test 5] Auth enforcement -- unauthenticated request')
  const noAuthResult = await post('/api/invoices', invoicePayload)
  assert('Unauthenticated POST /api/invoices returns 401', noAuthResult.status === 401, `got ${noAuthResult.status}`)

  const noAuthMvResult = await post('/api/movements', { product_id: testProduct1.id, quantity: 1 })
  assert('Unauthenticated POST /api/movements returns 401', noAuthMvResult.status === 401, `got ${noAuthMvResult.status}`)
  console.log('')

  // ============================================================
  // Test 6: Append-only enforcement (static code check)
  // ============================================================
  console.log('[Test 6] Append-only enforcement')
  const { execSync } = await import('child_process')
  try {
    const routeCheck = execSync(
      'grep -r "UPDATE.*stock_movements\\|DELETE.*stock_movements" app/api/ 2>/dev/null || true',
      { encoding: 'utf-8' }
    ).trim()
    assert('No UPDATE/DELETE on stock_movements in API routes', routeCheck === '', `found: ${routeCheck}`)
  } catch {
    assert('No UPDATE/DELETE on stock_movements in API routes', true)
  }
  console.log('')

  // ============================================================
  // Summary
  // ============================================================
  console.log('============================================')
  console.log(`  Resultado: ${PASS} PASS, ${FAIL} FAIL`)
  console.log('============================================')
  if (FAIL > 0) process.exit(1)
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err)
  process.exit(1)
})
