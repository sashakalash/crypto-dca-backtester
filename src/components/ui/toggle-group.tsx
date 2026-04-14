import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ToggleGroupProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ToggleGroup({ options, value, onChange, className }: ToggleGroupProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-secondary p-1', className)}>
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </div>
  )
}

function ToggleGroupItem({
  active,
  children,
  ...props
}: { active: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
      {...props}
    >
      {children}
    </button>
  )
}
