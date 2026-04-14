import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number
  format: (n: number) => string
  trend?: 'positive' | 'negative' | 'neutral'
  suffix?: string
}

export function MetricCard({
  label,
  value,
  format,
  trend = 'neutral',
  suffix,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    prevValue.current = value

    if (from === to) return

    const duration = 600
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplayValue(from + (to - from) * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          trend === 'positive' && 'text-profit',
          trend === 'negative' && 'text-loss',
          trend === 'neutral' && 'text-foreground'
        )}
      >
        {format(displayValue)}
        {suffix && <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>}
      </p>
    </Card>
  )
}
