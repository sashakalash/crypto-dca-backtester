import type { Strategy } from './types'
import type { InvestmentContext } from '@/engine/types'
import { sma } from '@/utils/math'

export class SmartDcaStrategy implements Strategy {
  private smaPeriod: number
  private threshold: number
  private dipMultiplier: number
  private rallyReducer: number

  constructor(smaPeriod = 20, threshold = 0.05, dipMultiplier = 1.5, rallyReducer = 0.5) {
    this.smaPeriod = smaPeriod
    this.threshold = threshold
    this.dipMultiplier = dipMultiplier
    this.rallyReducer = rallyReducer
  }

  getInvestmentAmount(context: InvestmentContext): number {
    const smaValue = sma(context.priceHistory, this.smaPeriod)

    if (smaValue === null) {
      return context.baseAmount
    }

    if (context.price < smaValue * (1 - this.threshold)) {
      return context.baseAmount * this.dipMultiplier
    }

    if (context.price > smaValue * (1 + this.threshold)) {
      return context.baseAmount * this.rallyReducer
    }

    return context.baseAmount
  }
}
