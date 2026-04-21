import { memo } from 'react'
import { useResults } from '@/contexts/ResultsContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate, formatCrypto } from '@/utils/formatters'

export const PurchasesTable = memo(function PurchasesTable() {
  const results = useResults()

  const dca = results.get('dca') ?? results.values().next().value
  const purchases = dca?.purchases ?? []

  if (purchases.length === 0) return null

  const displayPurchases = purchases.slice(-50)
  const hiddenCount = purchases.length - displayPurchases.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Purchase History
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({purchases.length} total)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4 text-right">Price</th>
                <th className="pb-2 pr-4 text-right">Invested</th>
                <th className="pb-2 pr-4 text-right">Coins</th>
                <th className="pb-2 text-right">Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {hiddenCount > 0 && (
                <tr>
                  <td colSpan={5} className="py-2 text-center text-muted-foreground">
                    ... {hiddenCount} earlier purchases
                  </td>
                </tr>
              )}
              {displayPurchases.map((p) => (
                <tr
                  key={`${p.date}-${p.price}-${p.coinsBought}`}
                  className="border-b border-border/50 hover:bg-secondary/30"
                >
                  <td className="py-1.5 pr-4 text-muted-foreground">
                    {formatDate(p.date)}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {formatCurrency(p.price, true)}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {formatCurrency(p.amountInvested, true)}
                  </td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">
                    {formatCrypto(p.coinsBought)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-medium">
                    {formatCurrency(p.portfolioValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
})
