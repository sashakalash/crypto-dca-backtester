import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { PriceDataProvider } from '@/contexts/PriceDataContext'
import { ResultsProvider } from '@/contexts/ResultsContext'
import { Header } from '@/components/layout/Header'
import { PresetBar } from '@/components/backtester/PresetBar'
import { ConfigPanel } from '@/components/backtester/ConfigPanel'
import { NarrativeSummary } from '@/components/backtester/NarrativeSummary'
import { MetricGrid } from '@/components/backtester/MetricGrid'
import { PurchasesTable } from '@/components/backtester/PurchasesTable'

const PriceChart = lazy(() =>
  import('@/components/charts/lightweight/PriceChart').then((m) => ({
    default: m.PriceChart,
  }))
)
const PortfolioValueArea = lazy(() =>
  import('@/components/charts/recharts/PortfolioValueArea').then((m) => ({
    default: m.PortfolioValueArea,
  }))
)
const StrategyComparisonBar = lazy(() =>
  import('@/components/charts/recharts/StrategyComparisonBar').then((m) => ({
    default: m.StrategyComparisonBar,
  }))
)
const CumulativeChart = lazy(() =>
  import('@/components/charts/recharts/CumulativeChart').then((m) => ({
    default: m.CumulativeChart,
  }))
)
const ReturnHeatmap = lazy(() =>
  import('@/components/charts/d3/ReturnHeatmap').then((m) => ({
    default: m.ReturnHeatmap,
  }))
)
const DrawdownWaterfall = lazy(() =>
  import('@/components/charts/d3/DrawdownWaterfall').then((m) => ({
    default: m.DrawdownWaterfall,
  }))
)
const PurchaseScatter = lazy(() =>
  import('@/components/charts/d3/PurchaseScatter').then((m) => ({
    default: m.PurchaseScatter,
  }))
)
const ReturnDistribution = lazy(() =>
  import('@/components/charts/d3/ReturnDistribution').then((m) => ({
    default: m.ReturnDistribution,
  }))
)

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/20" />
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PriceDataProvider>
          <ResultsProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Header />
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="mb-6">
                  <PresetBar />
                </div>
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <aside className="space-y-6">
                    <ConfigPanel />
                  </aside>
                  <div className="space-y-6">
                    <NarrativeSummary />
                    <MetricGrid />
                    <Suspense fallback={<ChartSkeleton />}>
                      <PriceChart />
                    </Suspense>
                    <div className="grid gap-6 xl:grid-cols-2">
                      <Suspense fallback={<ChartSkeleton />}>
                        <PortfolioValueArea />
                      </Suspense>
                      <Suspense fallback={<ChartSkeleton />}>
                        <StrategyComparisonBar />
                      </Suspense>
                    </div>
                    <Suspense fallback={<ChartSkeleton />}>
                      <CumulativeChart />
                    </Suspense>
                    <div className="grid gap-6 xl:grid-cols-2">
                      <Suspense fallback={<ChartSkeleton />}>
                        <DrawdownWaterfall />
                      </Suspense>
                      <Suspense fallback={<ChartSkeleton />}>
                        <ReturnDistribution />
                      </Suspense>
                    </div>
                    <Suspense fallback={<ChartSkeleton />}>
                      <PurchaseScatter />
                    </Suspense>
                    <Suspense fallback={<ChartSkeleton />}>
                      <ReturnHeatmap />
                    </Suspense>
                    <PurchasesTable />
                  </div>
                </div>
              </main>
            </div>
          </ResultsProvider>
        </PriceDataProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
