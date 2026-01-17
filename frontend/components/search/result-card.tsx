'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Paper } from '@/hooks/use-search'
import { useQueryState } from 'nuqs'
import React from 'react'
import { BibtexDialog } from './bibtex-dialog'
import { useGemini } from '@/context/gemini-context'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResultCard({ paper }: { paper: Paper }) {
    const [, setQ] = useQueryState('q')
    const { openGemini } = useGemini()

    return (
        <Card className="hover:bg-accent/5 transition-colors border-transparent hover:border-border">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium leading-tight">
                    <a
                        href={paper.ee_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-primary decoration-2 underline-offset-4 text-primary"
                        dangerouslySetInnerHTML={{
                            __html: paper._formatted?.title || paper.title
                        }}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                    {(paper._formatted?.authors || paper.authors).map((authorHtml, idx, arr) => {
                        const cleanName = paper.authors?.[idx] || authorHtml.replace(/<\/?em>/g, '');
                        return (
                            <React.Fragment key={idx}>
                                <button
                                    onClick={() => setQ(cleanName)}
                                    className="hover:text-foreground hover:underline transition-colors"
                                    dangerouslySetInnerHTML={{ __html: authorHtml }}
                                />
                                {idx < arr.length - 1 && ", "}
                            </React.Fragment>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="font-normal">
                        <span dangerouslySetInnerHTML={{ __html: paper._formatted?.venue || paper.venue }} />
                    </Badge>
                    <span
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: String(paper._formatted?.year || paper.year) }}
                    />
                    <span className="text-muted-foreground mx-1">•</span>
                    <span className="text-muted-foreground">
                        Cited by {paper._formatted?.citation_count || paper.citation_count || 0}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                            onClick={() => openGemini(paper)}
                        >
                            <Sparkles className="w-3 h-3" />
                            Gemini Insight
                        </Button>
                        <BibtexDialog paper={paper} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
