export interface PricePoint {
  timestamp: number
  price: number
}

export type InvestmentInterval = 'daily' | 'weekly' | 'monthly'

export type StrategyType = 'dca' | 'lumpSum' | 'valueAveraging' | 'smartDca'

export interface InvestmentContext {
  date: Date
  price: number
  portfolioValue: number
  totalInvested: number
  coinsHeld: number
  averageCostBasis: number
  priceHistory: number[]
  baseAmount: number
  stepIndex: number
  totalSteps: number
}

export interface StrategyConfig {
  type: StrategyType
  label: string
  baseAmount: number
  interval: InvestmentInterval
  feeRate: number
  // Value averaging
  targetGrowthRate?: number
  // Smart DCA
  smaPeriod?: number
  smaThreshold?: number
  dipMultiplier?: number
  rallyReducer?: number
}

export interface Purchase {
  date: number
  price: number
  amountInvested: number
  coinsBought: number
  fee: number
  cumulativeCoins: number
  cumulativeInvested: number
  portfolioValue: number
}

export interface TimelinePoint {
  timestamp: number
  portfolioValue: number
  totalInvested: number
  price: number
  coinsHeld: number
}

export interface BacktestResult {
  strategyType: StrategyType
  strategyLabel: string
  purchases: Purchase[]
  timeline: TimelinePoint[]
  metrics: BacktestMetrics
}

export interface BacktestMetrics {
  totalInvested: number
  finalValue: number
  totalCoins: number
  averageCostBasis: number
  totalReturn: number
  totalReturnPercent: number
  cagr: number
  maxDrawdown: number
  maxDrawdownDate: number
  sharpeRatio: number
  sortinoRatio: number
  bestPurchasePrice: number
  worstPurchasePrice: number
  timeInProfitPercent: number
  numberOfPurchases: number
}

export interface SensitivityResult {
  startDate: number
  endDate: number
  totalReturn: number
  annualizedReturn: number
  maxDrawdown: number
  holdingMonths: number
}

export interface CoinMeta {
  id: string
  symbol: string
  name: string
  color: string
}
