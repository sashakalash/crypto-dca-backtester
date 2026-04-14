import type { Strategy } from './types'
import type { InvestmentContext } from '@/engine/types'

export class LumpSumStrategy implements Strategy {
  getInvestmentAmount(context: InvestmentContext): number {
    if (context.stepIndex === 0) {
      return context.baseAmount * context.totalSteps
    }
    return 0
  }
}
