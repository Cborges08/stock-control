import { getStockLevel, STATUS_COLORS } from '@/lib/utils/stock'
import { parseNumeric } from '@/lib/parsers'
import { cn } from '@/lib/utils'

const LABELS: Record<ReturnType<typeof getStockLevel>, string> = {
  healthy: 'Normal',
  low: 'Baixo',
  depleted: 'Esgotado',
}

interface ProductStatusBadgeProps {
  current: unknown
  min: unknown
}

export function ProductStatusBadge({ current, min }: ProductStatusBadgeProps) {
  const level = getStockLevel(parseNumeric(current), parseNumeric(min))
  const colors = STATUS_COLORS[level]
  const label = LABELS[level]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal',
        colors.tailwind
      )}
    >
      {label}
    </span>
  )
}
