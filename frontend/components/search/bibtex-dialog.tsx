'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Quote, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Paper } from '@/hooks/use-search'

export function BibtexDialog({ paper }: { paper: Paper }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [content, setContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            const dblpKey = paper.dblp_key || paper._formatted?.dblp_key
            // Priority: Fetch from DBLP if key exists
            if (dblpKey) {
                setIsLoading(true)
                fetch(`https://dblp.org/rec/${dblpKey}.bib`)
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to fetch')
                        return res.text()
                    })
                    .then(text => setContent(text))
                    .catch(err => {
                        console.error("BibTeX fetch failed, falling back to local generation", err)
                        // Fallback
                        setContent(generateFallbackBibtex(paper))
                    })
                    .finally(() => setIsLoading(false))
            } else {
                setContent(generateFallbackBibtex(paper))
            }
        }
    }, [open, paper])

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <Quote className="h-3.5 w-3.5" />
                    <span className="sr-only">Cite</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>BibTeX Citation</DialogTitle>
                </DialogHeader>
                <div className="relative rounded-md bg-muted p-4 font-mono text-xs overflow-x-auto min-h-[100px] flex">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap break-all w-full">{content}</pre>
                    )}

                    {!isLoading && (
                        <Button
                            size="icon"
                            variant="outline"
                            className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function generateFallbackBibtex(paper: Paper) {
    const dblpKey = paper.dblp_key || paper._formatted?.dblp_key
    return `@inproceedings{${dblpKey || `conf/${paper.venue.toLowerCase()}/${paper.year}`},
  author    = {${paper.authors.join(' and ')}},
  title     = {${paper.title}},
  booktitle = {${paper.venue}},
  year      = {${paper.year}},
  url       = {${paper.ee_link}}
}`
}
