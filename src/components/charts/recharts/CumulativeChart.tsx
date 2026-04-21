import { useEffect, useRef, memo } from 'react'
import { select, pointer } from 'd3-selection'
import { scaleTime, scaleLinear } from 'd3-scale'
import { max, bisector } from 'd3-array'
import { area as d3Area, line as d3Line, curveMonotoneX } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { useResults } from '@/contexts/ResultsContext'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CHART_COLORS } from '@/utils/colors'
import { formatCurrency, formatDateShort } from '@/utils/formatters'

type DataRow = { timestamp: number; invested: number; value: number }

const MARGIN = { top: 10, right: 20, bottom: 40, left: 90 }
const HEIGHT = 280
const VALUE_COLOR = '#6366f1'

function renderTooltip(tip: HTMLDivElement, d: DataRow) {
  tip.replaceChildren()

  const header = document.createElement('div')
  header.textContent = formatDateShort(d.timestamp)
  header.style.fontWeight = '600'
  header.style.marginBottom = '4px'
  tip.appendChild(header)

  const valueRow = document.createElement('div')
  const valueDot = document.createElement('span')
  valueDot.textContent = '■ '
  valueDot.style.color = VALUE_COLOR
  valueRow.appendChild(valueDot)
  valueRow.appendChild(document.createTextNode(`Portfolio: ${formatCurrency(d.value)}`))
  tip.appendChild(valueRow)

  const invRow = document.createElement('div')
  invRow.style.color = CHART_COLORS.invested
  invRow.textContent = `─ Invested: ${formatCurrency(d.invested)}`
  tip.appendChild(invRow)

  const profitRow = document.createElement('div')
  const profit = d.value - d.invested
  profitRow.style.color = profit >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss
  profitRow.textContent = `Δ P&L: ${formatCurrency(profit)}`
  tip.appendChild(profitRow)
}

export const CumulativeChart = memo(function CumulativeChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const renderStateRef = useRef<{
    x: ReturnType<typeof scaleTime>
    data: DataRow[]
    innerW: number
  } | null>(null)

  const { width } = useResizeObserver(containerRef)
  const results = useResults()

  const dca0 = results.get('dca') ?? results.values().next().value
  const chartData: DataRow[] = dca0
    ? dca0.timeline.map((pt) => ({
        timestamp: pt.timestamp,
        invested: pt.totalInvested,
        value: pt.portfolioValue,
      }))
    : []

  useEffect(() => {
    if (!svgRef.current || width === 0 || chartData.length === 0) return

    const innerW = width - MARGIN.left - MARGIN.right
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', HEIGHT)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const x = scaleTime()
      .domain([chartData[0].timestamp, chartData[chartData.length - 1].timestamp])
      .range([0, innerW])

    const yMax = max(chartData, (d) => Math.max(d.value, d.invested)) ?? 0
    const y = scaleLinear()
      .domain([0, yMax * 1.05])
      .range([innerH, 0])

    renderStateRef.current = { x, data: chartData, innerW }

    // Grid
    g.append('g')
      .call(
        axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .call((sel) => {
        sel.select('.domain').remove()
        sel
          .selectAll('line')
          .attr('stroke', CHART_COLORS.grid)
          .attr('stroke-opacity', 0.4)
      })

    // Portfolio value area
    g.append('path')
      .datum(chartData)
      .attr(
        'd',
        d3Area<DataRow>()
          .x((d) => x(d.timestamp))
          .y0(innerH)
          .y1((d) => y(d.value))
          .curve(curveMonotoneX)
      )
      .attr('fill', VALUE_COLOR)
      .attr('fill-opacity', 0.1)

    g.append('path')
      .datum(chartData)
      .attr(
        'd',
        d3Line<DataRow>()
          .x((d) => x(d.timestamp))
          .y((d) => y(d.value))
          .curve(curveMonotoneX)
      )
      .attr('fill', 'none')
      .attr('stroke', VALUE_COLOR)
      .attr('stroke-width', 2)

    // Invested dashed step line
    g.append('path')
      .datum(chartData)
      .attr(
        'd',
        d3Line<DataRow>()
          .x((d) => x(d.timestamp))
          .y((d) => y(d.invested))
          .curve(curveMonotoneX)
      )
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.invested)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5 5')

    // Crosshair
    const xhair = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#52525b')
      .attr('stroke-dasharray', '4 2')
      .attr('stroke-width', 1)
      .style('display', 'none')

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        axisBottom(x)
          .ticks(6)
          .tickFormat((d) => formatDateShort(d as number))
      )
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11)

    g.append('g')
      .call(
        axisLeft(y)
          .ticks(5)
          .tickFormat((d) => formatCurrency(d as number))
      )
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11)

    svg.selectAll('.domain, .tick line').attr('stroke', CHART_COLORS.grid)

    // Interaction overlay
    const bisect = bisector<DataRow, number>((d) => d.timestamp).left
    svg
      .append('rect')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        const state = renderStateRef.current
        if (!state || !svgRef.current) return
        const [mx] = pointer(event, svgRef.current)
        const innerMx = mx - MARGIN.left
        if (innerMx < 0 || innerMx > state.innerW) return

        const ts = state.x.invert(innerMx).getTime()
        const i = bisect(state.data, ts, 1)
        const a = state.data[i - 1]
        const b = state.data[i]
        const d = !b || Math.abs(ts - a.timestamp) <= Math.abs(ts - b.timestamp) ? a : b

        xhair
          .attr('x1', state.x(d.timestamp) as number)
          .attr('x2', state.x(d.timestamp) as number)
          .style('display', null)

        const tip = tooltipRef.current
        if (!tip) return
        renderTooltip(tip, d)
        tip.style.display = 'block'
        tip.style.left = `${Math.min(mx + 10, width - 165)}px`
        tip.style.top = '8px'
      })
      .on('mouseleave', () => {
        xhair.style('display', 'none')
        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      })
  }, [chartData, width])

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invested vs Portfolio Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full">
          <svg ref={svgRef} className="w-full" />
          <div
            ref={tooltipRef}
            className="absolute pointer-events-none rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
            style={{ display: 'none', minWidth: 175, zIndex: 10 }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded"
              style={{ backgroundColor: VALUE_COLOR }}
            />
            Portfolio Value
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 border-t border-dashed border-muted-foreground" />
            Total Invested
          </span>
        </div>
      </CardContent>
    </Card>
  )
})
