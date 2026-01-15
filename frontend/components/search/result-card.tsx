import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Paper } from '@/hooks/use-search'

export function ResultCard({ paper }: { paper: Paper }) {
    return (
        <Card className="hover:bg-accent/5 transition-colors border-transparent hover:border-border">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium leading-tight">
                    <a
                        href={paper.ee_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-primary decoration-2 underline-offset-4 text-primary"
                    >
                        {paper.title}
                    </a>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                    {paper.authors.join(', ')}
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="font-normal">
                        {paper.venue}
                    </Badge>
                    <span className="text-muted-foreground">{paper.year}</span>
                </div>
            </CardContent>
        </Card>
    )
}
