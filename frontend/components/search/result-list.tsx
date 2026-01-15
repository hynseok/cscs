'use client'

import React, { useEffect, useRef } from 'react'
import { ResultCard } from './result-card'
import { useSearch } from '@/hooks/use-search'
import { Skeleton } from '@/components/ui/skeleton'
import { useInView } from 'react-intersection-observer'
import { useQueryState, parseAsInteger } from 'nuqs'

export function ResultList() {
    const { data, isLoading, isError, error } = useSearch()

    // Stats display
    const stats = data ? (
        <div className="text-sm text-muted-foreground mb-4">
            Found {data.estimatedTotalHits.toLocaleString()} results ({data.processingTimeMs}ms)
        </div>
    ) : null

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-4xl">
                <Skeleton className="h-4 w-48 mb-6" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-3 border p-4 rounded-lg">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return <div className="text-destructive">Error loading results: {error instanceof Error ? error.message : 'Unknown error'}</div>
    }

    if (!data?.hits.length) {
        return <div className="text-muted-foreground">No results found.</div>
    }

    return (
        <div className="max-w-4xl space-y-4 pb-10">
            {stats}
            <div className="space-y-4">
                {data.hits.map((paper) => (
                    <ResultCard key={paper.id} paper={paper} />
                ))}
            </div>

            {/* Pagination or Virtual Scroll Trigger */}
            <PaginationControl />
        </div>
    )
}

function PaginationControl() {
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
    const { data } = useSearch()

    const handleNext = () => setPage(page + 1)
    const handlePrev = () => setPage(Math.max(1, page - 1))

    return (
        <div className="flex items-center gap-4 mt-8 justify-center">
            <button
                onClick={handlePrev}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
                Previous
            </button>
            <span className="text-sm">Page {page}</span>
            <button
                onClick={handleNext}
                disabled={!data?.hits || data.hits.length === 0}
                className="px-4 py-2 text-sm border rounded hover:bg-accent disabled:opacity-50"
            >
                Next
            </button>
        </div>
    )
}
