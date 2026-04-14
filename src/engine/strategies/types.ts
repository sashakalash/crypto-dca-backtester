import type { InvestmentContext } from '@/engine/types'

export interface Strategy {
  getInvestmentAmount(context: InvestmentContext): number
}
