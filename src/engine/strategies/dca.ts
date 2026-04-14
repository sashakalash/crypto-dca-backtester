import type { Strategy } from './types'
import type { InvestmentContext } from '@/engine/types'

export class DcaStrategy implements Strategy {
  getInvestmentAmount(context: InvestmentContext): number {
    return context.baseAmount
  }
}
