import { useMemo } from 'react'
import { useResults } from '@/contexts/ResultsContext'
import { MetricCard } from './MetricCard'
import { formatCurrency, formatPercent } from '@/utils/formatters'

export function MetricGrid() {
  const { results } = useResults()

  const dcaMetrics = useMemo(() => {
    const dca = results.get('dca')
    if (!dca) {
      const first = results.values().next().value
      return first?.metrics ?? null
    }
    return dca.metrics
  }, [results])

  const lumpSumMetrics = useMemo(() => {
    return results.get('lumpSum')?.metrics ?? null
  }, [results])

  if (!dcaMetrics) return null

  const dcaVsLump = lumpSumMetrics
    ? dcaMetrics.totalReturnPercent - lumpSumMetrics.totalReturnPercent
    : null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Total Invested"
        value={dcaMetrics.totalInvested}
        format={formatCurrency}
      />
      <MetricCard
        label="Portfolio Value"
        value={dcaMetrics.finalValue}
        format={formatCurrency}
        trend={dcaMetrics.finalValue > dcaMetrics.totalInvested ? 'positive' : 'negative'}
      />
      <MetricCard
        label="Total Return"
        value={dcaMetrics.totalReturnPercent}
        format={formatPercent}
        trend={dcaMetrics.totalReturnPercent > 0 ? 'positive' : 'negative'}
      />
      <MetricCard
        label="CAGR"
        value={dcaMetrics.cagr}
        format={formatPercent}
        trend={dcaMetrics.cagr > 0 ? 'positive' : 'negative'}
      />
      <MetricCard
        label="Max Drawdown"
        value={dcaMetrics.maxDrawdown}
        format={formatPercent}
        trend="negative"
      />
      <MetricCard
        label="Sharpe Ratio"
        value={dcaMetrics.sharpeRatio}
        format={(n) => n.toFixed(2)}
        trend={dcaMetrics.sharpeRatio > 1 ? 'positive' : 'neutral'}
      />
      <MetricCard
        label="Avg Cost Basis"
        value={dcaMetrics.averageCostBasis}
        format={(n) => formatCurrency(n, true)}
      />
      {dcaVsLump !== null && (
        <MetricCard
          label="DCA vs Lump Sum"
          value={dcaVsLump}
          format={formatPercent}
          trend={dcaVsLump > 0 ? 'positive' : 'negative'}
        />
      )}
    </div>
  )
}
