import type { PricePoint } from '@/engine/types'

const BUNDLED_COINS = new Set(['bitcoin', 'ethereum'])

export async function loadBundledPriceData(coinId: string): Promise<PricePoint[] | null> {
  if (!BUNDLED_COINS.has(coinId)) return null
  const res = await fetch(`/data/${coinId}-usd.json`)
  if (!res.ok) return null
  return res.json() as Promise<PricePoint[]>
}

export function hasBundledData(coinId: string): boolean {
  return BUNDLED_COINS.has(coinId)
}
