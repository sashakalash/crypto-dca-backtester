export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null
  const slice = values.slice(-period)
  return slice.reduce((sum, v) => sum + v, 0) / period
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null
  const k = 2 / (period + 1)
  let emaVal = values.slice(0, period).reduce((s, v) => s + v, 0) / period
  for (let i = period; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k)
  }
  return emaVal
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1))
}

export function downsideDeviation(values: number[], threshold = 0): number {
  const downside = values.filter((v) => v < threshold).map((v) => (v - threshold) ** 2)
  if (downside.length === 0) return 0
  return Math.sqrt(downside.reduce((s, v) => s + v, 0) / values.length)
}

export function kde(data: number[], bandwidth: number, points: number[]): number[] {
  const n = data.length
  return points.map((x) => {
    const sum = data.reduce((acc, xi) => {
      const u = (x - xi) / bandwidth
      return acc + Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)
    }, 0)
    return sum / (n * bandwidth)
  })
}

export function silvermanBandwidth(data: number[]): number {
  const sd = standardDeviation(data)
  const iqr = percentile(data, 75) - percentile(data, 25)
  const spread = Math.min(sd, iqr / 1.34)
  return 0.9 * spread * Math.pow(data.length, -0.2)
}

function percentile(sorted: number[], p: number): number {
  const copy = [...sorted].sort((a, b) => a - b)
  const idx = (p / 100) * (copy.length - 1)
  const lower = Math.floor(idx)
  const frac = idx - lower
  if (lower + 1 >= copy.length) return copy[lower]
  return copy[lower] + frac * (copy[lower + 1] - copy[lower])
}
