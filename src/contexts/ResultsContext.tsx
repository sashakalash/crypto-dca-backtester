import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { BacktestResult, StrategyConfig, StrategyType } from '@/engine/types'
import { useSettings } from './SettingsContext'
import { usePriceData } from './PriceDataContext'
import { runBacktest } from '@/engine/runner'
import { formatCurrency, formatPercent } from '@/utils/formatters'

const STRATEGY_LABELS: Record<StrategyType, string> = {
  dca: 'Dollar-Cost Averaging',
  lumpSum: 'Lump Sum',
  valueAveraging: 'Value Averaging',
  smartDca: 'Smart DCA',
}

interface ResultsContextValue {
  results: Map<StrategyType, BacktestResult>
  narrativeSummary: string | null
  isReady: boolean
}

const ResultsContext = createContext<ResultsContextValue | null>(null)

export function ResultsProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const { priceData, isLoading } = usePriceData()

  const results = useMemo(() => {
    if (!priceData || priceData.length === 0) return new Map()

    const map = new Map<StrategyType, BacktestResult>()
    const startDate = new Date(settings.startDate)
    const endDate = new Date(settings.endDate)

    for (const strategyType of settings.activeStrategies) {
      const config: StrategyConfig = {
        type: strategyType,
        label: STRATEGY_LABELS[strategyType],
        baseAmount: settings.amount,
        interval: settings.interval,
        feeRate: settings.feeRate,
        targetGrowthRate: 0.01,
        smaPeriod: 20,
        smaThreshold: 0.05,
        dipMultiplier: 1.5,
        rallyReducer: 0.5,
      }

      const result = runBacktest(config, priceData, startDate, endDate)
      map.set(strategyType, result)
    }

    return map
  }, [priceData, settings])

  const narrativeSummary = useMemo(() => {
    const dcaResult = results.get('dca')
    if (!dcaResult) return null

    const { metrics } = dcaResult
    const lumpResult = results.get('lumpSum')

    let summary = `Investing ${formatCurrency(settings.amount)} ${settings.interval} into ${settings.coinId === 'bitcoin' ? 'Bitcoin' : settings.coinId === 'ethereum' ? 'Ethereum' : settings.coinId}, you would have invested ${formatCurrency(metrics.totalInvested)} across ${metrics.numberOfPurchases} purchases. Your portfolio would be worth ${formatCurrency(metrics.finalValue)} — a ${formatPercent(metrics.totalReturnPercent)} return.`

    if (lumpResult) {
      const diff = metrics.totalReturnPercent - lumpResult.metrics.totalReturnPercent
      const better = diff > 0 ? 'outperformed' : 'underperformed'
      summary += ` DCA ${better} lump sum by ${formatPercent(Math.abs(diff))}.`
    }

    if (metrics.maxDrawdown > 0) {
      summary += ` Worst drawdown: ${formatPercent(metrics.maxDrawdown)}.`
    }

    return summary
  }, [results, settings])

  const isReady = !isLoading && results.size > 0

  const value = useMemo(
    () => ({ results, narrativeSummary, isReady }),
    [results, narrativeSummary, isReady]
  )

  return <ResultsContext value={value}>{children}</ResultsContext>
}

export function useResults() {
  const ctx = useContext(ResultsContext)
  if (!ctx) throw new Error('useResults must be used within ResultsProvider')
  return ctx
}
