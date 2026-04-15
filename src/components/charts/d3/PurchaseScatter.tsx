import { useEffect, useRef, useMemo, memo } from 'react'
import { select } from 'd3-selection'
import { scaleTime, scaleLinear, scaleSqrt } from 'd3-scale'
import { min, max } from 'd3-array'
import { line, curveMonotoneX } from 'd3-shape'
import { axisBottom, axisLeft } from 'd3-axis'
import { useResults } from '@/contexts/ResultsContext'
import { usePriceData } from '@/contexts/PriceDataContext'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDateShort } from '@/utils/formatters'

const MARGIN = { top: 10, right: 20, bottom: 40, left: 65 }

export const PurchaseScatter = memo(function PurchaseScatter() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)
  const { priceData } = usePriceData()
  const results = useResults()

  const dcaResult = useMemo(() => {
    return results.get('dca') ?? results.values().next().value ?? null
  }, [results])

  useEffect(() => {
    if (!svgRef.current || width === 0 || !priceData || !dcaResult) return

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const height = 300
    const innerWidth = width - MARGIN.left - MARGIN.right
    const innerHeight = height - MARGIN.top - MARGIN.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    const startTs = new Date(dcaResult.timeline[0]?.timestamp ?? 0).getTime()
    const endTs = new Date(
      dcaResult.timeline[dcaResult.timeline.length - 1]?.timestamp ?? 0
    ).getTime()

    const filteredPrices = priceData.filter(
      (p) => p.timestamp >= startTs && p.timestamp <= endTs
    )

    const x = scaleTime().domain([startTs, endTs]).range([0, innerWidth])

    const allPrices = filteredPrices.map((p) => p.price)
    const y = scaleLinear()
      .domain([min(allPrices) ?? 0, (max(allPrices) ?? 100) * 1.05])
      .range([innerHeight, 0])

    const maxInvestment = max(dcaResult.purchases, (p) => p.amountInvested) ?? 100
    const radius = scaleSqrt().domain([0, maxInvestment]).range([2, 8])

    // Price line
    const lineGen = line<{ timestamp: number; price: number }>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.price))
      .curve(curveMonotoneX)

    g.append('path')
      .datum(filteredPrices)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)

    // Average cost basis line
    const avgCost = dcaResult.metrics.averageCostBasis
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y(avgCost))
      .attr('y2', y(avgCost))
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '6 3')

    g.append('text')
      .attr('x', innerWidth - 4)
      .attr('y', y(avgCost) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#f59e0b')
      .attr('font-size', 9)
      .text(`Avg cost: ${formatCurrency(avgCost, true)}`)

    // Purchase bubbles
    g.selectAll('circle.purchase')
      .data(dcaResult.purchases)
      .join('circle')
      .attr('class', 'purchase')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.price))
      .attr('r', (d) => radius(d.amountInvested))
      .attr('fill', (d) =>
        d.price < avgCost ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
      )
      .attr('stroke', (d) => (d.price < avgCost ? '#22c55e' : '#ef4444'))
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .append('title')
      .text(
        (d) =>
          `${formatDateShort(d.date)}\nPrice: ${formatCurrency(d.price, true)}\nInvested: ${formatCurrency(d.amountInvested, true)}\n${d.price < avgCost ? 'Below' : 'Above'} avg cost`
      )

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
          .ticks(6)
          .tickFormat((d) => formatCurrency(d as number))
      )
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 10)

    g.selectAll('.domain, .tick line').attr('stroke', '#27272a')
  }, [priceData, dcaResult, width])

  if (!dcaResult) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Points on Price Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full" />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-profit" />
            Below avg cost (good buy)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-loss" />
            Above avg cost
          </span>
          <span>Bubble size = investment amount</span>
        </div>
      </CardContent>
    </Card>
  )
})
