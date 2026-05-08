'use client'

import { useState } from 'react'
import { BatchTag } from '@/components/stock/BatchTag'
import { parseNumeric } from '@/lib/parsers'

interface MovementRow {
  id: string
  created_at: string
  product_description: string
  product_id: string
  batch_number: string
  batch_opened_at: string
  type: 'entry' | 'withdrawal'
  quantity: unknown
  operator_name: string
}

interface MovementTableProps {
  movements: MovementRow[]
}

const PAGE_SIZE = 10

export function MovementTable({ movements }: MovementTableProps) {
  const [filterType, setFilterType] = useState<'all' | 'entry' | 'withdrawal'>('all')
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [page, setPage] = useState<number>(1)

  const uniqueProducts = Array.from(
    new Map(movements.map(m => [m.product_id, m.product_description])).entries()
  )

  const filtered = movements.filter(m =>
    (filterType === 'all' || m.type === filterType) &&
    (filterProduct === 'all' || m.product_id === filterProduct)
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilterType(value: 'all' | 'entry' | 'withdrawal') {
    setFilterType(value)
    setPage(1)
  }

  function handleFilterProduct(value: string) {
    setFilterProduct(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterType}
          onChange={e => handleFilterType(e.target.value as 'all' | 'entry' | 'withdrawal')}
          className="border rounded px-2 py-1 text-sm bg-background"
        >
          <option value="all">Todos</option>
          <option value="entry">Entradas</option>
          <option value="withdrawal">Retiradas</option>
        </select>

        <select
          value={filterProduct}
          onChange={e => handleFilterProduct(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-background"
        >
          <option value="all">Todos</option>
          {uniqueProducts.map(([id, description]) => (
            <option key={id} value={id}>
              {description}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-muted-foreground text-left">
              <th className="py-2 pr-4 font-medium">Data/Hora</th>
              <th className="py-2 pr-4 font-medium">Produto</th>
              <th className="py-2 pr-4 font-medium">Lote</th>
              <th className="py-2 pr-4 font-medium">Tipo</th>
              <th className="py-2 pr-4 font-medium">Qtd</th>
              <th className="py-2 font-medium">Operador</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhuma movimentacao registrada.
                </td>
              </tr>
            ) : (
              paginated.map(row => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(row.created_at))}
                  </td>
                  <td className="py-2 pr-4">{row.product_description}</td>
                  <td className="py-2 pr-4">
                    <BatchTag
                      batchNumber={row.batch_number}
                      openedAt={row.batch_opened_at}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    {row.type === 'entry' ? (
                      <span className="text-green-700 font-medium">Entrada</span>
                    ) : (
                      <span className="text-red-700 font-medium">Saida</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {parseNumeric(row.quantity).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2">{row.operator_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 justify-end text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proximo
          </button>
        </div>
      )}
    </div>
  )
}
