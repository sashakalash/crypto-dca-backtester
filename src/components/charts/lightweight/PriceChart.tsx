import { useEffect, useRef, useMemo } from 'react'
import {
  createChart,
  createSeriesMarkers,
  BaselineSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  ColorType,
  type BaselineSeriesPartialOptions,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts'
import { useResults } from '@/contexts/ResultsContext'
import { usePriceData } from '@/contexts/PriceDataContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CHART_COLORS } from '@/utils/colors'

function toChartTime(ts: number): Time {
  return (ts / 1000) as Time
}

export function PriceChart() {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Baseline'> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const { priceData } = usePriceData()
  const { results } = useResults()

  const dcaResult = useMemo(() => {
    return results.get('dca') ?? results.values().next().value ?? null
  }, [results])

  const avgCostBasis = dcaResult?.metrics.averageCostBasis ?? 0

  const chartData = useMemo(() => {
    if (!priceData) return []
    return priceData.map((p) => ({
      time: toChartTime(p.timestamp),
      value: p.price,
    }))
  }, [priceData])

  const markers: SeriesMarker<Time>[] = useMemo(() => {
    if (!dcaResult) return []
    return dcaResult.purchases.map((p) => ({
      time: toChartTime(p.date),
      position: 'belowBar' as const,
      color: p.price < avgCostBasis ? '#22c55e' : '#ef4444',
      shape: 'circle' as const,
      size: 0.5,
    }))
  }, [dcaResult, avgCostBasis])

  useEffect(() => {
    if (!chartRef.current) return

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: CHART_COLORS.text,
        fontFamily: 'system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        vertLine: { labelBackgroundColor: '#6366f1' },
        horzLine: { labelBackgroundColor: '#6366f1' },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const baselineOptions: BaselineSeriesPartialOptions = {
      baseValue: { type: 'price', price: avgCostBasis || 10000 },
      topLineColor: '#22c55e',
      topFillColor1: 'rgba(34, 197, 94, 0.15)',
      topFillColor2: 'rgba(34, 197, 94, 0.02)',
      bottomLineColor: '#ef4444',
      bottomFillColor1: 'rgba(239, 68, 68, 0.02)',
      bottomFillColor2: 'rgba(239, 68, 68, 0.15)',
      lineWidth: 2,
    }

    const series = chart.addSeries(BaselineSeries, baselineOptions)

    chartInstance.current = chart
    seriesRef.current = series

    const seriesMarkers = createSeriesMarkers(series)
    markersRef.current = seriesMarkers

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        })
      }
    })
    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartInstance.current = null
      seriesRef.current = null
      markersRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!seriesRef.current || chartData.length === 0) return
    seriesRef.current.setData(chartData)

    if (markersRef.current) {
      markersRef.current.setMarkers(markers)
    }

    if (avgCostBasis > 0) {
      seriesRef.current.applyOptions({
        baseValue: { type: 'price', price: avgCostBasis },
      })
    }

    chartInstance.current?.timeScale().fitContent()
  }, [chartData, markers, avgCostBasis])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History & Purchase Points</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[400px] w-full" />
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-profit" />
            Above avg cost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-loss" />
            Below avg cost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-4 rounded bg-muted-foreground" />
            Purchase points
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
