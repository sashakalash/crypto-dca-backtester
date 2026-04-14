import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import type { PricePoint } from '@/engine/types'
import { useSettings } from './SettingsContext'
import { loadBundledPriceData } from '@/data/staticLoader'

interface PriceDataContextValue {
  priceData: PricePoint[] | null
  isLoading: boolean
  error: string | null
  dataSource: 'bundled' | 'api' | null
}

const PriceDataContext = createContext<PriceDataContextValue | null>(null)

export function PriceDataProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'bundled' | 'api' | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadBundledPriceData(settings.coinId).then((bundled) => {
      if (cancelled) return
      if (bundled) {
        setPriceData(bundled)
        setDataSource('bundled')
      } else {
        setError(
          `No bundled data available for ${settings.coinId}. Add a CoinGecko API key for live data.`
        )
        setPriceData(null)
        setDataSource(null)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [settings.coinId])

  const value = useMemo(
    () => ({ priceData, isLoading, error, dataSource }),
    [priceData, isLoading, error, dataSource]
  )

  return <PriceDataContext value={value}>{children}</PriceDataContext>
}

export function usePriceData() {
  const ctx = useContext(PriceDataContext)
  if (!ctx) throw new Error('usePriceData must be used within PriceDataProvider')
  return ctx
}
