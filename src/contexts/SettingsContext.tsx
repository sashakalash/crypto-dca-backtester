import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { InvestmentInterval, StrategyType } from '@/engine/types'
import { PRESETS, type Preset } from '@/data/presets'

interface Settings {
  coinId: string
  amount: number
  interval: InvestmentInterval
  startDate: string
  endDate: string
  feeRate: number
  activeStrategies: StrategyType[]
  activePresetId: string | null
}

interface SettingsFunctionsValue {
  updateSettings: (partial: Partial<Settings>) => void
  applyPreset: (preset: Preset) => void
}

const defaultPreset = PRESETS[0]

const defaultSettings: Settings = {
  coinId: defaultPreset.coinId,
  amount: defaultPreset.amount,
  interval: defaultPreset.interval,
  startDate: defaultPreset.startDate,
  endDate: defaultPreset.endDate,
  feeRate: 0.001,
  activeStrategies: defaultPreset.strategies,
  activePresetId: defaultPreset.id,
}

const SettingsContext = createContext<Settings | null>(null)
const SettingsFunctionsContext = createContext<SettingsFunctionsValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial, activePresetId: null }))
  }, [])

  const applyPreset = useCallback((preset: Preset) => {
    setSettings({
      coinId: preset.coinId,
      amount: preset.amount,
      interval: preset.interval,
      startDate: preset.startDate,
      endDate: preset.endDate,
      feeRate: 0.001,
      activeStrategies: preset.strategies,
      activePresetId: preset.id,
    })
  }, [])

  return (
    <SettingsContext value={settings}>
      <SettingsFunctionsContext value={{ updateSettings, applyPreset }}>
        {children}
      </SettingsFunctionsContext>
    </SettingsContext>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

export function useSettingsUpdate() {
  const ctx = useContext(SettingsFunctionsContext)
  if (!ctx) throw new Error('useSettingsUpdate must be used within SettingsProvider')
  return ctx
}
