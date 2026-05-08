export interface ProductStockParsed {
  id: string
  code: string
  description: string
  unit: string
  status: 'active' | 'depleted' | 'archived'
  min_stock_alert: number
  current_stock: number
  avg_price: number | null
  last_movement_at: string | null
}

export interface CreateInvoiceResult {
  invoice_id: string
  batch_ids: string[]
  movement_ids: string[]
}

export interface CreateMovementResult {
  movement_id: string
  batch_id: string
  batch_number: string
  quantity: number
  unit_price_snapshot: number
  product_id: string
}

export interface FifoBatchInfo {
  batch_number: string
  opened_at: string
  available_stock: number
}
