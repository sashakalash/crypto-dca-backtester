import { Button } from '@/components/ui/button'
import { PRESETS } from '@/data/presets'
import { useSettings } from '@/contexts/SettingsContext'

export function PresetBar() {
  const { settings, applyPreset } = useSettings()

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.id}
          variant={settings.activePresetId === preset.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPreset(preset)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
