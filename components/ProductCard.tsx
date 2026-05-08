'use client'

import { parseNumeric } from '@/lib/parsers'
import { ProductStatusBadge } from '@/components/stock/ProductStatusBadge'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    description: string
    unit: string
    status: string
    current_stock: unknown
    min_stock_alert: unknown
  }
  onWithdraw?: (productId: string) => void
}

export function ProductCard({ product, onWithdraw }: ProductCardProps) {
  const currentStock = parseNumeric(product.current_stock)
  const isDisabled = currentStock <= 0 || product.status === 'archived'

  function handleWithdraw() {
    if (!isDisabled && onWithdraw) {
      onWithdraw(product.id)
    }
  }

  return (
    <Card className={cn(isDisabled && 'opacity-50')}>
      <CardHeader className="pb-2">
        <p className="font-semibold text-base leading-tight">{product.description}</p>
        <p className="text-muted-foreground text-sm">{product.unit}</p>
      </CardHeader>
      <CardContent className="flex items-center justify-between pb-2">
        <span className="text-lg font-medium">
          {currentStock.toLocaleString('pt-BR')} {product.unit}
        </span>
        <ProductStatusBadge
          current={product.current_stock}
          min={product.min_stock_alert}
        />
      </CardContent>
      <CardFooter>
        <Button
          className={cn('w-full', isDisabled && 'cursor-not-allowed')}
          disabled={isDisabled}
          onClick={handleWithdraw}
        >
          Retirar
        </Button>
      </CardFooter>
    </Card>
  )
}
