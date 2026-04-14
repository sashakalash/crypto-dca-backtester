import type { Strategy } from './types'
import type { InvestmentContext } from '@/engine/types'

export class ValueAveragingStrategy implements Strategy {
  private targetGrowthRate: number

  constructor(targetGrowthRate = 0.01) {
    this.targetGrowthRate = targetGrowthRate
  }

  getInvestmentAmount(context: InvestmentContext): number {
    const targetValue =
      context.baseAmount *
      (context.stepIndex + 1) *
      Math.pow(1 + this.targetGrowthRate, context.stepIndex + 1)

    const needed = targetValue - context.portfolioValue
    return Math.max(0, needed)
  }
}
