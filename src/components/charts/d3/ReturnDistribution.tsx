import { useEffect, useRef, useMemo, memo } from 'react'
import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { extent, max, range, bin } from 'd3-array'
import { line, curveBasis } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { useResults } from '@/contexts/ResultsContext'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { kde, silvermanBandwidth } from '@/utils/math'

const MARGIN = { top: 10, right: 20, bottom: 40, left: 50 }

export const ReturnDistribution = memo(function ReturnDistribution() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)
  const results = useResults()

  const returns = useMemo(() => {
    const dca = results.get('dca') ?? results.values().next().value
    if (!dca) return []

    const periodicReturns: number[] = []
    for (let i = 1; i < dca.timeline.length; i++) {
      const prev = dca.timeline[i - 1].portfolioValue
      if (prev > 0) {
        periodicReturns.push(((dca.timeline[i].portfolioValue - prev) / prev) * 100)
      }
    }
    return periodicReturns
  }, [results])

  useEffect(() => {
    if (!svgRef.current || width === 0 || returns.length < 10) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const height = 280
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Histogram bins
    const ext = extent(returns) as [number, number]
    const binCount = Math.min(50, Math.ceil(Math.sqrt(returns.length)))

    const x = scaleLinear().domain(ext).nice().range([0, innerWidth])

    const histogram = bin()
      .domain(x.domain() as [number, number])
      .thresholds(binCount)

    const bins = histogram(returns)
    const maxBinLength = max(bins, (b) => b.length) ?? 1

    const y = scaleLinear().domain([0, maxBinLength]).range([innerHeight, 0])

    // Bars
    g.selectAll('rect')
      .data(bins)
      .join('rect')
      .attr('x', (d) => x(d.x0 ?? 0) + 1)
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(0, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 2))
      .attr('height', (d) => innerHeight - y(d.length))
      .attr('fill', (d) => {
        const mid = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2
        return mid >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
      })
      .attr('rx', 1)

    // KDE overlay
    const bandwidth = silvermanBandwidth(returns)
    if (bandwidth > 0) {
      const kdePoints = range(ext[0], ext[1], (ext[1] - ext[0]) / 100)
      const kdeValues = kde(returns, bandwidth, kdePoints)

      const kdeMax = max(kdeValues) ?? 1
      const yKde = scaleLinear().domain([0, kdeMax]).range([innerHeight, 0])

      const lineGen = line<number>()
        .x((_, i) => x(kdePoints[i]))
        .y((d) => yKde(d))
        .curve(curveBasis)

      g.append('path')
        .datum(kdeValues)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', '#8b5cf6')
        .attr('stroke-width', 2)
    }

    // Zero line
    if (x.domain()[0] < 0 && x.domain()[1] > 0) {
      g.append('line')
        .attr('x1', x(0))
        .attr('x2', x(0))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#71717a')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3')
    }

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        axisBottom(x)
          .ticks(8)
          .tickFormat((d) => `${(d as number).toFixed(1)}%`)
      )
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    g.append('g')
      .call(axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    g.selectAll('.domain, .tick line').attr('stroke', '#27272a')

    // Label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#71717a')
      .attr('font-size', 11)
      .text('Periodic Return (%)')
  }, [returns, width])

  if (returns.length < 10) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Return Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full" />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#8b5cf6]" />
            KDE density curve
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-profit" />
            Positive returns
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-loss" />
            Negative returns
          </span>
        </div>
      </CardContent>
    </Card>
  )
})
