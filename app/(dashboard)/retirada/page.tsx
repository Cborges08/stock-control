import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseNumeric } from '@/lib/parsers'
import type { ProductStockParsed, FifoBatchInfo } from '@/lib/types'
import { ProductGrid } from '@/components/stock/ProductGrid'
import { MovementTable } from '@/components/MovementTable'
import { StockChartLoader } from '@/components/StockChartLoader'

export default async function RetiradaPage() {
  const supabase = createClient()

  // Auth guard: getUser() validates JWT server-side — required pattern (T-08-06)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query 1: Product stock from VIEW (RET-01)
  const { data: stockRows } = await supabase.from('product_stock').select('*')

  const products: ProductStockParsed[] = (stockRows ?? []).map((r) => ({
    id: r.id!,
    code: r.code!,
    description: r.description!,
    unit: r.unit!,
    status: r.status as ProductStockParsed['status'],
    min_stock_alert: parseNumeric(r.min_stock_alert),
    current_stock: parseNumeric(r.current_stock),
    avg_price: r.avg_price ? parseNumeric(r.avg_price) : null,
    last_movement_at: r.last_movement_at ?? null,
  }))

  // Query 2: FIFO batch preview per product — first open batch per product_id (D-01)
  const { data: fifoBatchRows } = await supabase
    .from('batches')
    .select('id, product_id, batch_number, opened_at, quantity_in, quantity_out, unit_price')
    .eq('status', 'open')
    .order('opened_at', { ascending: true })

  // Build FIFO batch entries: first open batch per product_id
  const fifoBatchMap = new Map<string, FifoBatchInfo>()
  for (const b of fifoBatchRows ?? []) {
    if (!fifoBatchMap.has(b.product_id)) {
      fifoBatchMap.set(b.product_id, {
        batch_number: b.batch_number,
        opened_at: b.opened_at,
        available_stock: parseNumeric(b.quantity_in) - parseNumeric(b.quantity_out),
      })
    }
  }
  // Serialize Map to array of tuples for client component prop passing (RSC boundary)
  const fifoBatchEntries: [string, FifoBatchInfo][] = Array.from(fifoBatchMap.entries())

  // Query 3: Last 30 movements with joins (RET-11) — T-08-08 accepted, limited to 30 rows
  const { data: movementRows } = await supabase
    .from('stock_movements')
    .select(`
      id,
      created_at,
      type,
      quantity,
      product_id,
      products ( description ),
      batches ( batch_number, opened_at ),
      profiles:user_id ( display_name )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  const movements = (movementRows ?? []).map((r) => {
    type ProductJoin = { description: string } | null
    type BatchJoin = { batch_number: string; opened_at: string } | null
    type ProfileJoin = { display_name: string } | null

    const product = (r.products as unknown) as ProductJoin
    const batch = (r.batches as unknown) as BatchJoin
    const profile = (r.profiles as unknown) as ProfileJoin

    return {
      id: r.id,
      created_at: r.created_at,
      product_description: product?.description ?? 'Desconhecido',
      product_id: r.product_id,
      batch_number: batch?.batch_number ?? '\u2014',
      batch_opened_at: batch?.opened_at ?? '',
      type: r.type as 'entry' | 'withdrawal',
      quantity: r.quantity,
      operator_name: profile?.display_name ?? 'Sistema',
    }
  })

  // Layout: side-by-side on desktop (D-09, D-10) — grid 60% left, table 40% right
  return (
    <div className="flex flex-col lg:flex-row gap-8 px-6 py-6">
      <div className="w-full lg:w-3/5">
        <div className="h-[200px] mb-6">
          <StockChartLoader data={products} />
        </div>
        <h1 className="text-xl font-semibold mb-6">Retirada de Estoque</h1>
        <ProductGrid products={products} fifoBatchEntries={fifoBatchEntries} />
      </div>
      <div className="w-full lg:w-2/5">
        <h2 className="text-lg font-semibold mb-4">Movimentacoes Recentes</h2>
        <MovementTable movements={movements} />
      </div>
    </div>
  )
}
