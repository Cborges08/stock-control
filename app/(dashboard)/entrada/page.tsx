import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseNumeric } from '@/lib/parsers'
import type { ProductStockParsed } from '@/lib/types'
import { InvoiceForm } from '@/components/invoice/InvoiceForm'
import { SidebarStockPanel } from '@/components/invoice/SidebarStockPanel'
import { StockChartLoader } from '@/components/StockChartLoader'

export default async function EntradaPage() {
  const supabase = createClient()

  // Auth guard: getUser() validates JWT server-side — required pattern
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch product_stock VIEW for sidebar (all products with computed stock)
  const { data: stockRows } = await supabase.from('product_stock').select('*')

  // Fetch products table for combobox — active only (D-05)
  const { data: productRows } = await supabase
    .from('products')
    .select('id, description, code, ncm')
    .eq('status', 'active')

  // Parse NUMERIC columns from strings to numbers (Pitfall 6)
  const stock: ProductStockParsed[] = (stockRows ?? []).map((r) => ({
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

  return (
    <div className="flex gap-8 px-6 py-6">
      <div className="flex-1 min-w-0">
        <div className="h-[200px] mb-6">
          <StockChartLoader data={stock} />
        </div>
        <h1 className="text-xl font-semibold mb-6">Entrada de Nota Fiscal</h1>
        <InvoiceForm products={productRows ?? []} />
      </div>
      <div className="w-80 shrink-0">
        <SidebarStockPanel initialStock={stock} />
      </div>
    </div>
  )
}
