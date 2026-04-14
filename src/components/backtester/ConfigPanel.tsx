import { useSettings } from '@/contexts/SettingsContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { settings, updateSettings } = useSettings()

  const toggleStrategy = (strategy: StrategyType) => {
    const current = settings.activeStrategies
    const updated = current.includes(strategy)
      ? current.filter((s) => s !== strategy)
      : [...current, strategy]
    if (updated.length > 0) {
      updateSettings({ activeStrategies: updated })
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
            value={settings.coinId}
            onChange={(e) => updateSettings({ coinId: e.target.value })}
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
            value={settings.amount}
            onChange={(e) =>
              updateSettings({ amount: Math.max(1, Number(e.target.value)) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <ToggleGroup
            options={INTERVAL_OPTIONS}
            value={settings.interval}
            onChange={(v) => updateSettings({ interval: v as InvestmentInterval })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input
              type="date"
              value={settings.startDate}
              onChange={(e) => updateSettings({ startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input
              type="date"
              value={settings.endDate}
              onChange={(e) => updateSettings({ endDate: e.target.value })}
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
            value={(settings.feeRate * 100).toFixed(2)}
            onChange={(e) =>
              updateSettings({
                feeRate: Math.max(0, Number(e.target.value)) / 100,
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
