import { cn } from '@/lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'appearance-none cursor-pointer',
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
