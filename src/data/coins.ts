import type { CoinMeta } from '@/engine/types'

export const COINS: CoinMeta[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627eea' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#9945ff' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', color: '#0033ad' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: '#c2a633' },
]

export function getCoinById(id: string): CoinMeta | undefined {
  return COINS.find((c) => c.id === id)
}
