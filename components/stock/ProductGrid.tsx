'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { ProductCard } from '@/components/ProductCard'
import { WithdrawalModal } from '@/components/stock/WithdrawalModal'
import { Input } from '@/components/ui/input'
import type { ProductStockParsed, FifoBatchInfo } from '@/lib/types'

interface ProductGridProps {
  products: ProductStockParsed[]
  fifoBatchEntries: [string, FifoBatchInfo][]
}

export function ProductGrid({ products, fifoBatchEntries }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const debouncedQuery = useDebounce(searchQuery, 300)

  const fifoBatches = useMemo(
    () => new Map(fifoBatchEntries),
    [fifoBatchEntries]
  )

  const filtered = useMemo(() => {
    return products
      .filter(p =>
        p.description.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .sort((a, b) => a.current_stock - b.current_stock)
  }, [products, debouncedQuery])

  const selectedProduct = selectedProductId
    ? products.find(p => p.id === selectedProductId) ?? null
    : null

  const selectedFifoBatch = selectedProductId
    ? fifoBatches.get(selectedProductId) ?? null
    : null

  return (
    <div>
      {/* Search input with icon per D-05 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product grid or empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-semibold text-base">Nenhum produto encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique o termo de busca ou aguarde o cadastro de novos produtos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onWithdraw={(id) => setSelectedProductId(id)}
            />
          ))}
        </div>
      )}

      {/* WithdrawalModal — always rendered, controlled via open prop */}
      <WithdrawalModal
        product={selectedProduct}
        fifoBatch={selectedFifoBatch}
        open={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  )
}
