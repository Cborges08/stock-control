export type StockLevel = 'healthy' | 'low' | 'depleted'

export function getStockLevel(current: number, min: number): StockLevel {
  if (current <= 0) return 'depleted'
  if (current < min) return 'low'
  return 'healthy'
}

export const STATUS_COLORS: Record<StockLevel, { tailwind: string; hex: string }> = {
  healthy:  { tailwind: 'bg-green-100 text-green-800',  hex: '#16a34a' },
  low:      { tailwind: 'bg-yellow-100 text-yellow-800', hex: '#ca8a04' },
  depleted: { tailwind: 'bg-red-100 text-red-800',      hex: '#dc2626' },
}
