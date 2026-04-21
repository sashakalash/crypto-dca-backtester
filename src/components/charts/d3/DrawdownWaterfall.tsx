import { useEffect, useRef, memo } from 'react'
import { select } from 'd3-selection'
import { scaleTime, scaleLinear } from 'd3-scale'
import { extent, min } from 'd3-array'
import { area, line, curveMonotoneX } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { useResults } from '@/contexts/ResultsContext'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatDateShort } from '@/utils/formatters'

const MARGIN = { top: 10, right: 20, bottom: 40, left: 55 }

interface DrawdownPoint {
  timestamp: number
  drawdown: number
  peak: number
  value: number
}

export const DrawdownWaterfall = memo(function DrawdownWaterfall() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)
  const results = useResults()

  const dca0 = results.get('dca') ?? results.values().next().value
  let peak = 0
  const drawdownData: DrawdownPoint[] = dca0
    ? dca0.timeline.map((point) => {
        if (point.portfolioValue > peak) peak = point.portfolioValue
        const drawdown = peak > 0 ? ((peak - point.portfolioValue) / peak) * -100 : 0
        return { timestamp: point.timestamp, drawdown, peak, value: point.portfolioValue }
      })
    : []

  useEffect(() => {
    if (!svgRef.current || width === 0 || drawdownData.length === 0) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const height = 250
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const x = scaleTime()
      .domain(extent(drawdownData, (d) => d.timestamp) as [number, number])
      .range([0, innerWidth])

    const minDrawdown = min(drawdownData, (d) => d.drawdown) ?? -50
    const y = scaleLinear()
      .domain([minDrawdown * 1.1, 0])
      .range([innerHeight, 0])

    // Gradient for the area
    const defs = svg.append('defs')
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'drawdown-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(239, 68, 68, 0.05)')
    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(239, 68, 68, 0.4)')

    // Area
    const areaGen = area<DrawdownPoint>()
      .x((d) => x(d.timestamp))
      .y0(y(0))
      .y1((d) => y(d.drawdown))
      .curve(curveMonotoneX)

    g.append('path')
      .datum(drawdownData)
      .attr('d', areaGen)
      .attr('fill', 'url(#drawdown-gradient)')

    // Line
    const lineGen = line<DrawdownPoint>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.drawdown))
      .curve(curveMonotoneX)

    g.append('path')
      .datum(drawdownData)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1)

    // Mark max drawdown
    const maxDD = drawdownData.reduce((acc, d) => (d.drawdown < acc.drawdown ? d : acc))
    g.append('circle')
      .attr('cx', x(maxDD.timestamp))
      .attr('cy', y(maxDD.drawdown))
      .attr('r', 4)
      .attr('fill', '#ef4444')
      .attr('stroke', '#0a0a0f')
      .attr('stroke-width', 2)

    g.append('text')
      .attr('x', x(maxDD.timestamp))
      .attr('y', y(maxDD.drawdown) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ef4444')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .text(`${maxDD.drawdown.toFixed(1)}%`)

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        axisBottom(x)
          .ticks(6)
          .tickFormat((d) => formatDateShort(d as number))
      )
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    g.append('g')
      .call(
        axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      )
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    g.selectAll('.domain, .tick line').attr('stroke', '#27272a')
  }, [drawdownData, width])

  if (drawdownData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drawdown from Peak</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full" />
        </div>
      </CardContent>
    </Card>
  )
})
