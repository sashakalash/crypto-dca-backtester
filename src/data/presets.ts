import type { InvestmentInterval, StrategyType } from '@/engine/types'

export interface Preset {
  id: string
  label: string
  description: string
  coinId: string
  amount: number
  interval: InvestmentInterval
  startDate: string // ISO date
  endDate: string
  strategies: StrategyType[]
}

export const PRESETS: Preset[] = [
  {
    id: 'btc-weekly-100',
    label: 'BTC Weekly $100',
    description: '$100/week into Bitcoin since Jan 2020',
    coinId: 'bitcoin',
    amount: 100,
    interval: 'weekly',
    startDate: '2020-01-01',
    endDate: '2025-01-01',
    strategies: ['dca', 'lumpSum'],
  },
  {
    id: 'eth-monthly-500',
    label: 'ETH Monthly $500',
    description: '$500/month into Ethereum since Jan 2021',
    coinId: 'ethereum',
    amount: 500,
    interval: 'monthly',
    startDate: '2021-01-01',
    endDate: '2025-01-01',
    strategies: ['dca', 'lumpSum'],
  },
  {
    id: 'btc-smart-dca',
    label: 'BTC Smart DCA',
    description: 'Smart DCA vs standard DCA — buy more on dips',
    coinId: 'bitcoin',
    amount: 100,
    interval: 'weekly',
    startDate: '2020-01-01',
    endDate: '2025-01-01',
    strategies: ['dca', 'smartDca', 'lumpSum'],
  },
  {
    id: 'btc-all-strategies',
    label: 'All Strategies Compared',
    description: 'Compare all 4 strategies on Bitcoin',
    coinId: 'bitcoin',
    amount: 100,
    interval: 'weekly',
    startDate: '2020-01-01',
    endDate: '2025-01-01',
    strategies: ['dca', 'lumpSum', 'valueAveraging', 'smartDca'],
  },
]
