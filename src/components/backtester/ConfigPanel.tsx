import { useEffect, useState, useTransition } from 'react'
import { useSettings, useSettingsUpdate } from '@/contexts/SettingsContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { COINS } from '@/data/coins'
import type { InvestmentInterval, StrategyType } from '@/engine/types'

const INTERVAL_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const STRATEGY_OPTIONS: { value: StrategyType; label: string }[] = [
  { value: 'dca', label: 'DCA' },
  { value: 'lumpSum', label: 'Lump Sum' },
  { value: 'valueAveraging', label: 'Value Avg' },
  { value: 'smartDca', label: 'Smart DCA' },
]

export function ConfigPanel() {
  const settings = useSettings()
  const { updateSettings } = useSettingsUpdate()
  const [, startTransition] = useTransition()

  // Local state as strings — allows clearing, no jump-back-to-1 behaviour
  const [localAmount, setLocalAmount] = useState(String(settings.amount))
  const [localFeeRate, setLocalFeeRate] = useState(String(settings.feeRate * 100))
  const [localCoinId, setLocalCoinId] = useState(settings.coinId)
  const [localInterval, setLocalInterval] = useState<InvestmentInterval>(
    settings.interval
  )
  const [localStartDate, setLocalStartDate] = useState(settings.startDate)
  const [localEndDate, setLocalEndDate] = useState(settings.endDate)

  // Sync when settings change from external sources (presets)
  useEffect(() => {
    setLocalAmount(String(settings.amount))
    setLocalFeeRate(String(settings.feeRate * 100))
    setLocalCoinId(settings.coinId)
    setLocalInterval(settings.interval)
    setLocalStartDate(settings.startDate)
    setLocalEndDate(settings.endDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.coinId])

  // Debounce only number inputs — validate only when syncing to settings
  useEffect(() => {
    const parsed = parseFloat(localAmount)
    if (!localAmount || isNaN(parsed)) return
    const timeout = setTimeout(() => {
      updateSettings({ amount: Math.max(1, parsed) })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAmount])

  useEffect(() => {
    const parsed = parseFloat(localFeeRate)
    if (localFeeRate === '' || isNaN(parsed)) return
    const timeout = setTimeout(() => {
      updateSettings({ feeRate: Math.max(0, parsed) / 100 })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFeeRate])

  // Immediate updates for selects (no debounce)
  const handleCoinChange = (value: string) => {
    setLocalCoinId(value)
    updateSettings({ coinId: value })
  }

  const handleIntervalChange = (value: InvestmentInterval) => {
    setLocalInterval(value)
    startTransition(() => updateSettings({ interval: value }))
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setLocalStartDate(value)
      startTransition(() => updateSettings({ startDate: value }))
    } else {
      setLocalEndDate(value)
      startTransition(() => updateSettings({ endDate: value }))
    }
  }

  const toggleStrategy = (strategy: StrategyType) => {
    const updated = settings.activeStrategies.includes(strategy)
      ? settings.activeStrategies.filter((s) => s !== strategy)
      : [...settings.activeStrategies, strategy]
    if (updated.length > 0) {
      startTransition(() => updateSettings({ activeStrategies: updated }))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Coin</Label>
          <Select
            value={localCoinId}
            onChange={(e) => handleCoinChange(e.target.value)}
            options={COINS.map((c) => ({
              value: c.id,
              label: `${c.symbol} — ${c.name}`,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Amount per period ($)</Label>
          <Input
            type="number"
            min={1}
            value={localAmount}
            onChange={(e) => setLocalAmount(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <ToggleGroup
            options={INTERVAL_OPTIONS}
            value={localInterval}
            onChange={(v) => handleIntervalChange(v as InvestmentInterval)}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <DatePicker
              value={localStartDate}
              onChange={(v) => handleDateChange('start', v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <DatePicker
              value={localEndDate}
              onChange={(v) => handleDateChange('end', v)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Strategies</Label>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleStrategy(opt.value)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  settings.activeStrategies.includes(opt.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Fee rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={5}
            step={0.01}
            value={localFeeRate}
            onChange={(e) => setLocalFeeRate(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
