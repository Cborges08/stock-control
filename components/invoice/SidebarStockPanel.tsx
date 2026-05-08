'use client'

import { useState } from 'react'
import { StockChartLoader } from '@/components/StockChartLoader'
import { ProductStatusBadge } from '@/components/stock/ProductStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductStockParsed } from '@/lib/types'

interface SidebarStockPanelProps {
  initialStock: ProductStockParsed[]
}

export function SidebarStockPanel({ initialStock }: SidebarStockPanelProps) {
  const [sortKey, setSortKey] = useState<'description' | 'current_stock'>('description')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: 'description' | 'current_stock') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const mul = sortDir === 'asc' ? 1 : -1
  const sorted = [...initialStock].sort((a, b) => {
    if (sortKey === 'description') {
      return a.description.localeCompare(b.description) * mul
    }
    return (a.current_stock - b.current_stock) * mul
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Estoque Atual</CardTitle>
      </CardHeader>
      <CardContent>
        {initialStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        ) : (
          <>
            <div className="h-[300px]">
              <StockChartLoader data={initialStock} />
            </div>
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left py-2 font-semibold cursor-pointer select-none"
                      onClick={() => toggleSort('description')}
                    >
                      Produto {sortKey === 'description' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      className="text-right py-2 font-semibold cursor-pointer select-none"
                      onClick={() => toggleSort('current_stock')}
                    >
                      Estoque {sortKey === 'current_stock' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-center py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="py-2">{row.description}</td>
                      <td className="py-2 text-right">
                        {row.current_stock.toLocaleString('pt-BR')} {row.unit}
                      </td>
                      <td className="py-2 text-center">
                        <ProductStatusBadge current={row.current_stock} min={row.min_stock_alert} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
