import type { PricePoint, StrategyConfig, SensitivityResult } from './types'
import { runBacktest } from './runner'
import { addMonths } from 'date-fns'

export function runSensitivityAnalysis(
  config: StrategyConfig,
  priceData: PricePoint[],
  overallStart: Date,
  overallEnd: Date,
  stepMonths = 1
): SensitivityResult[] {
  const results: SensitivityResult[] = []
  let startDate = new Date(overallStart)

  while (startDate < overallEnd) {
    let endDate = addMonths(startDate, 3)

    while (endDate <= overallEnd) {
      const holdingMonths = Math.round(
        (endDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
      )

      const backtest = runBacktest(config, priceData, startDate, endDate)

      if (backtest.metrics.numberOfPurchases > 0) {
        const years = holdingMonths / 12
        const annualizedReturn =
          years > 0
            ? (Math.pow(1 + backtest.metrics.totalReturnPercent / 100, 1 / years) - 1) *
              100
            : backtest.metrics.totalReturnPercent

        results.push({
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          totalReturn: backtest.metrics.totalReturnPercent,
          annualizedReturn,
          maxDrawdown: backtest.metrics.maxDrawdown,
          holdingMonths,
        })
      }

      endDate = addMonths(endDate, 3)
    }

    startDate = addMonths(startDate, stepMonths)
  }

  return results
}
