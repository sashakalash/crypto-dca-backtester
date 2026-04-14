import { useEffect, useRef, useMemo, memo } from 'react'
import { select } from 'd3-selection'
import { scaleBand, scaleDiverging, scaleLinear } from 'd3-scale'
import { max } from 'd3-array'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import { useSettings } from '@/contexts/SettingsContext'
import { usePriceData } from '@/contexts/PriceDataContext'
import { runSensitivityAnalysis } from '@/engine/sensitivity'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { StrategyConfig } from '@/engine/types'
import { formatDateShort } from '@/utils/formatters'

const MARGIN = { top: 20, right: 80, bottom: 50, left: 70 }

export const ReturnHeatmap = memo(function ReturnHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)
  const { settings } = useSettings()
  const { priceData } = usePriceData()

  const sensitivityData = useMemo(() => {
    if (!priceData) return []

    const config: StrategyConfig = {
      type: 'dca',
      label: 'DCA',
      baseAmount: settings.amount,
      interval: settings.interval,
      feeRate: settings.feeRate,
    }

    return runSensitivityAnalysis(
      config,
      priceData,
      new Date(settings.startDate),
      new Date(settings.endDate),
      2
    )
  }, [priceData, settings])

  useEffect(() => {
    if (!svgRef.current || width === 0 || sensitivityData.length === 0) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const height = 350
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Get unique start dates and holding periods
    const startDates = [...new Set(sensitivityData.map((d) => d.startDate))].sort()
    const holdingPeriods = [...new Set(sensitivityData.map((d) => d.holdingMonths))].sort(
      (a, b) => a - b
    )

    const x = scaleBand()
      .domain(startDates.map(String))
      .range([0, innerWidth])
      .padding(0.02)
    const y = scaleBand()
      .domain(holdingPeriods.map(String))
      .range([0, innerHeight])
      .padding(0.02)

    const maxAbs = max(sensitivityData, (d) => Math.abs(d.totalReturn)) ?? 100
    const colorScale = scaleDiverging<string>()
      .domain([-maxAbs, 0, maxAbs])
      .interpolator(interpolateRdYlGn)

    // Cells
    g.selectAll('rect')
      .data(sensitivityData)
      .join('rect')
      .attr('x', (d) => x(String(d.startDate)) ?? 0)
      .attr('y', (d) => y(String(d.holdingMonths)) ?? 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', (d) => colorScale(d.totalReturn))
      .attr('rx', 1)
      .style('cursor', 'pointer')
      .append('title')
      .text(
        (d) =>
          `Start: ${formatDateShort(d.startDate)}\nHold: ${d.holdingMonths}mo\nReturn: ${d.totalReturn.toFixed(1)}%`
      )

    // X axis
    const xTickValues = startDates.filter(
      (_, i) => i % Math.ceil(startDates.length / 8) === 0
    )
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        axisBottom(x)
          .tickValues(xTickValues.map(String))
          .tickFormat((d) => formatDateShort(Number(d)))
      )
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)
      .attr('transform', 'rotate(-30)')
      .attr('text-anchor', 'end')

    g.selectAll('.domain, .tick line').attr('stroke', '#27272a')

    // Y axis
    g.append('g')
      .call(axisLeft(y).tickFormat((d) => `${d}mo`))
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#71717a')
      .attr('font-size', 11)
      .text('DCA Start Date')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .attr('fill', '#71717a')
      .attr('font-size', 11)
      .text('Holding Period')

    // Color legend
    const legendWidth = 15
    const legendHeight = innerHeight
    const legendScale = scaleLinear().domain([-maxAbs, maxAbs]).range([legendHeight, 0])

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width - MARGIN.right + 15},${MARGIN.top})`)

    const defs = svg.append('defs')
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')

    const steps = 10
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const value = -maxAbs + t * 2 * maxAbs
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(value))
    }

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#heatmap-gradient)')
      .attr('rx', 2)

    const legendAxis = axisRight(legendScale)
      .ticks(5)
      .tickFormat((d) => `${d}%`)

    legend
      .append('g')
      .attr('transform', `translate(${legendWidth},0)`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 9)

    legend.selectAll('.domain, .tick line').attr('stroke', '#27272a')
  }, [sensitivityData, width])

  if (sensitivityData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Heatmap — When Was the Best Time to Start?</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Each cell shows the total return for a DCA strategy starting at a given date and
          held for a given period. Green = positive, red = negative.
        </p>
      </CardContent>
    </Card>
  )
})
