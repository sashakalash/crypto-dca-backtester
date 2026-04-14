import { useEffect, useRef, useMemo, memo } from 'react'
import { select } from 'd3-selection'
import { scaleLinear, scaleBand } from 'd3-scale'
import { max } from 'd3-array'
import { axisBottom, axisLeft } from 'd3-axis'
import { useResults } from '@/contexts/ResultsContext'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { STRATEGY_COLORS, CHART_COLORS } from '@/utils/colors'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import type { StrategyType } from '@/engine/types'

const LABELS: Record<StrategyType, string> = {
  dca: 'DCA',
  lumpSum: 'Lump Sum',
  valueAveraging: 'Value Avg',
  smartDca: 'Smart DCA',
}

type BarRow = {
  strategy: string
  type: StrategyType
  finalValue: number
  returnPercent: number
}

const MARGIN = { top: 10, right: 20, bottom: 40, left: 100 }

export const StrategyComparisonBar = memo(function StrategyComparisonBar() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)
  const { results } = useResults()

  const data = useMemo((): BarRow[] => {
    return Array.from(results.entries()).map(([type, result]) => ({
      strategy: LABELS[type],
      type,
      finalValue: result.metrics.finalValue,
      returnPercent: result.metrics.totalReturnPercent,
    }))
  }, [results])

  useEffect(() => {
    if (!svgRef.current || width === 0 || data.length === 0) return

    const height = Math.max(140, data.length * 56 + MARGIN.top + MARGIN.bottom)
    const innerW = width - MARGIN.left - MARGIN.right
    const innerH = height - MARGIN.top - MARGIN.bottom

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const x = scaleLinear()
      .domain([0, (max(data, (d) => d.finalValue) ?? 0) * 1.1])
      .range([0, innerW])

    const y = scaleBand()
      .domain(data.map((d) => d.strategy))
      .range([0, innerH])
      .padding(0.25)

    // Grid
    g.append('g')
      .call(
        axisBottom(x)
          .ticks(4)
          .tickSize(innerH)
          .tickFormat(() => '')
      )
      .attr('transform', 'translate(0,0)')
      .call((sel) => {
        sel.select('.domain').remove()
        sel
          .selectAll('line')
          .attr('stroke', CHART_COLORS.grid)
          .attr('stroke-opacity', 0.4)
      })

    // Bars
    g.selectAll('rect.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.strategy) ?? 0)
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', (d) => x(d.finalValue))
      .attr('fill', (d) => STRATEGY_COLORS[d.type])
      .attr('rx', 3)

    // Value labels on bars
    g.selectAll('text.label')
      .data(data)
      .join('text')
      .attr('class', 'label')
      .attr('x', (d) => x(d.finalValue) + 6)
      .attr('y', (d) => (y(d.strategy) ?? 0) + y.bandwidth() / 2 + 4)
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11)
      .text((d) => `${formatCurrency(d.finalValue)} (${formatPercent(d.returnPercent)})`)

    // Tooltip via native title
    g.selectAll('rect.bar')
      .append('title')
      .text(
        (d) =>
          `${(d as BarRow).strategy}: ${formatCurrency((d as BarRow).finalValue)} — ${formatPercent((d as BarRow).returnPercent)} return`
      )

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        axisBottom(x)
          .ticks(4)
          .tickFormat((d) => formatCurrency(d as number))
      )
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11)

    g.append('g')
      .call(axisLeft(y).tickSize(0))
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 12)

    svg.selectAll('.domain').attr('stroke', CHART_COLORS.grid)
    svg.selectAll('.tick line').attr('stroke', 'none')
  }, [data, width])

  if (data.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Comparison — Final Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full" />
        </div>
      </CardContent>
    </Card>
  )
})
