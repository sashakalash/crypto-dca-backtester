import { runSensitivityAnalysis } from '@/engine/sensitivity'
import type { StrategyConfig, PricePoint } from '@/engine/types'

interface SensitivityMessage {
  config: StrategyConfig
  priceData: PricePoint[]
  startDate: string
  endDate: string
  param: number
}

self.addEventListener('message', (event: MessageEvent<SensitivityMessage>) => {
  const { config, priceData, startDate, endDate, param } = event.data

  try {
    const result = runSensitivityAnalysis(
      config,
      priceData,
      new Date(startDate),
      new Date(endDate),
      param
    )

    self.postMessage({ success: true, data: result })
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message })
  }
})
