import type { Purchase, TimelinePoint, BacktestMetrics } from './types'
import { standardDeviation, downsideDeviation } from '@/utils/math'

export function computeMetrics(
  purchases: Purchase[],
  timeline: TimelinePoint[],
  startDate: Date,
  endDate: Date
): BacktestMetrics {
  if (purchases.length === 0 || timeline.length === 0) {
    return emptyMetrics()
  }

  const lastPoint = timeline[timeline.length - 1]
  const totalInvested = lastPoint.totalInvested
  const finalValue = lastPoint.portfolioValue
  const totalCoins = lastPoint.coinsHeld
  const averageCostBasis = totalCoins > 0 ? totalInvested / totalCoins : 0
  const totalReturn = finalValue - totalInvested
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  // CAGR
  const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const cagr =
    years > 0 && totalInvested > 0
      ? (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100
      : 0

  // Max drawdown
  let peak = 0
  let maxDrawdown = 0
  let maxDrawdownDate = timeline[0].timestamp
  for (const point of timeline) {
    if (point.portfolioValue > peak) {
      peak = point.portfolioValue
    }
    const drawdown = peak > 0 ? ((peak - point.portfolioValue) / peak) * 100 : 0
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownDate = point.timestamp
    }
  }

  // Periodic returns for Sharpe/Sortino
  const periodicReturns: number[] = []
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1].portfolioValue
    if (prev > 0) {
      periodicReturns.push((timeline[i].portfolioValue - prev) / prev)
    }
  }

  const riskFreeRate = 0.04 / 365 // daily risk-free rate
  const avgReturn =
    periodicReturns.length > 0
      ? periodicReturns.reduce((s, v) => s + v, 0) / periodicReturns.length
      : 0
  const sd = standardDeviation(periodicReturns)
  const dd = downsideDeviation(periodicReturns, riskFreeRate)

  const sharpeRatio = sd > 0 ? ((avgReturn - riskFreeRate) / sd) * Math.sqrt(365) : 0
  const sortinoRatio = dd > 0 ? ((avgReturn - riskFreeRate) / dd) * Math.sqrt(365) : 0

  // Best/worst purchase
  const prices = purchases.map((p) => p.price)
  const bestPurchasePrice = Math.min(...prices)
  const worstPurchasePrice = Math.max(...prices)

  // Time in profit
  const daysInProfit = timeline.filter((p) => p.portfolioValue > p.totalInvested).length
  const timeInProfitPercent =
    timeline.length > 0 ? (daysInProfit / timeline.length) * 100 : 0

  return {
    totalInvested,
    finalValue,
    totalCoins,
    averageCostBasis,
    totalReturn,
    totalReturnPercent,
    cagr,
    maxDrawdown,
    maxDrawdownDate,
    sharpeRatio,
    sortinoRatio,
    bestPurchasePrice,
    worstPurchasePrice,
    timeInProfitPercent,
    numberOfPurchases: purchases.length,
  }
}

function emptyMetrics(): BacktestMetrics {
  return {
    totalInvested: 0,
    finalValue: 0,
    totalCoins: 0,
    averageCostBasis: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    cagr: 0,
    maxDrawdown: 0,
    maxDrawdownDate: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    bestPurchasePrice: 0,
    worstPurchasePrice: 0,
    timeInProfitPercent: 0,
    numberOfPurchases: 0,
  }
}
