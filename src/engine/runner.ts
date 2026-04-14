import type {
  PricePoint,
  StrategyConfig,
  BacktestResult,
  Purchase,
  TimelinePoint,
  InvestmentContext,
} from './types'
import { createStrategy } from './strategies/registry'
import { applyFee } from './fees'
import { computeMetrics } from './metrics'
import { generateIntervalDates, findClosestPriceDate } from '@/utils/dateUtils'

export function runBacktest(
  config: StrategyConfig,
  priceData: PricePoint[],
  startDate: Date,
  endDate: Date
): BacktestResult {
  const strategy = createStrategy(config)
  const intervalDates = generateIntervalDates(startDate, endDate, config.interval)
  const priceMap = new Map(priceData.map((p) => [p.timestamp, p.price]))
  const priceTimestamps = priceData.map((p) => p.timestamp)

  const purchases: Purchase[] = []
  const timeline: TimelinePoint[] = []
  const priceHistoryWindow: number[] = []

  let totalCoins = 0
  let totalInvested = 0

  // Build price history up to start date for SMA calculations
  for (const p of priceData) {
    if (p.timestamp >= startDate.getTime()) break
    priceHistoryWindow.push(p.price)
    if (priceHistoryWindow.length > 200) priceHistoryWindow.shift()
  }

  for (let i = 0; i < intervalDates.length; i++) {
    const date = intervalDates[i]
    const closestTs = findClosestPriceDate(date.getTime(), priceTimestamps)
    const price = priceMap.get(closestTs)

    if (price === undefined) continue

    priceHistoryWindow.push(price)
    if (priceHistoryWindow.length > 200) priceHistoryWindow.shift()

    const context: InvestmentContext = {
      date,
      price,
      portfolioValue: totalCoins * price,
      totalInvested,
      coinsHeld: totalCoins,
      averageCostBasis: totalCoins > 0 ? totalInvested / totalCoins : 0,
      priceHistory: [...priceHistoryWindow],
      baseAmount: config.baseAmount,
      stepIndex: i,
      totalSteps: intervalDates.length,
    }

    const investmentAmount = strategy.getInvestmentAmount(context)

    if (investmentAmount > 0) {
      const { netAmount, fee } = applyFee(investmentAmount, config.feeRate)
      const coinsBought = netAmount / price
      totalCoins += coinsBought
      totalInvested += investmentAmount

      purchases.push({
        date: closestTs,
        price,
        amountInvested: investmentAmount,
        coinsBought,
        fee,
        cumulativeCoins: totalCoins,
        cumulativeInvested: totalInvested,
        portfolioValue: totalCoins * price,
      })
    }

    timeline.push({
      timestamp: closestTs,
      portfolioValue: totalCoins * price,
      totalInvested,
      price,
      coinsHeld: totalCoins,
    })
  }

  // Extend timeline to end date with remaining price data
  const lastIntervalTs =
    intervalDates.length > 0
      ? intervalDates[intervalDates.length - 1].getTime()
      : startDate.getTime()

  for (const p of priceData) {
    if (p.timestamp <= lastIntervalTs) continue
    if (p.timestamp > endDate.getTime()) break
    timeline.push({
      timestamp: p.timestamp,
      portfolioValue: totalCoins * p.price,
      totalInvested,
      price: p.price,
      coinsHeld: totalCoins,
    })
  }

  const metrics = computeMetrics(purchases, timeline, startDate, endDate)

  return {
    strategyType: config.type,
    strategyLabel: config.label,
    purchases,
    timeline,
    metrics,
  }
}
