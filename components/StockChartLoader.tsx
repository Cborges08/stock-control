import dynamic from 'next/dynamic'
import type { StockChartProps } from './StockChart'

const StockChart = dynamic<StockChartProps>(
  () => import('./StockChart').then((m) => m.StockChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted animate-pulse rounded" />,
  }
)

export { StockChart as StockChartLoader }
export type { StockChartProps }
