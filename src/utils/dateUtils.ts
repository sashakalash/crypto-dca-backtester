import { addDays, addWeeks, addMonths, isAfter, isBefore, startOfDay } from 'date-fns'
import type { InvestmentInterval } from '@/engine/types'

export function generateIntervalDates(
  start: Date,
  end: Date,
  interval: InvestmentInterval
): Date[] {
  const dates: Date[] = []
  let current = startOfDay(start)
  const endDate = startOfDay(end)

  const advance =
    interval === 'daily' ? addDays : interval === 'weekly' ? addWeeks : addMonths

  while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
    dates.push(current)
    current = advance(current, 1)
    if (isAfter(current, endDate)) break
  }

  return dates
}

export function findClosestPriceDate(
  targetTimestamp: number,
  priceTimestamps: number[]
): number {
  let closest = priceTimestamps[0]
  let minDiff = Math.abs(targetTimestamp - closest)

  for (const ts of priceTimestamps) {
    const diff = Math.abs(targetTimestamp - ts)
    if (diff < minDiff) {
      minDiff = diff
      closest = ts
    }
    if (ts > targetTimestamp) break
  }

  return closest
}
