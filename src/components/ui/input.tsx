import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'placeholder:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}
