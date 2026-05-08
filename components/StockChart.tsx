'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Cell,
} from 'recharts'
import { getStockLevel, STATUS_COLORS } from '@/lib/utils/stock'
import { parseNumeric } from '@/lib/parsers'

export interface StockChartProps {
  data: Array<{
    description: string
    current_stock: unknown // string do Supabase
    min_stock_alert: unknown
  }>
}

interface ParsedEntry {
  description: string
  current_stock: number
  min_stock_alert: number
}

export function StockChart({ data }: StockChartProps) {
  const parsed: ParsedEntry[] = data.map((entry) => ({
    description: entry.description,
    current_stock: parseNumeric(entry.current_stock),
    min_stock_alert: parseNumeric(entry.min_stock_alert),
  }))

  // Usar media dos min_stock_alert como referencia
  const refLine =
    parsed.length > 0
      ? parsed.reduce((sum, e) => sum + e.min_stock_alert, 0) / parsed.length
      : 0

  return (
    <div className="h-full w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={parsed}
          margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
        >
          <XAxis type="number" fontSize={11} />
          <YAxis
            type="category"
            dataKey="description"
            width={100}
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '…' : v}
          />
          <Tooltip />
          <ReferenceLine
            x={refLine}
            stroke="#ca8a04"
            strokeDasharray="3 3"
          />
          <Bar dataKey="current_stock">
            {parsed.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  STATUS_COLORS[
                    getStockLevel(entry.current_stock, entry.min_stock_alert)
                  ].hex
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
