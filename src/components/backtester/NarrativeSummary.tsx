import { useResults } from '@/contexts/ResultsContext'
import { Card } from '@/components/ui/card'

export function NarrativeSummary() {
  const { narrativeSummary } = useResults()

  if (!narrativeSummary) return null

  return (
    <Card className="bg-primary/5 border-primary/20 p-5">
      <p className="text-sm leading-relaxed text-foreground">{narrativeSummary}</p>
    </Card>
  )
}
