import { cn } from '@/lib/utils'
import type { LabelHTMLAttributes } from 'react'

export function Label({
  className,
  htmlFor,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-xs font-medium text-muted-foreground', className)}
      {...props}
    >
      {children}
    </label>
  )
}
