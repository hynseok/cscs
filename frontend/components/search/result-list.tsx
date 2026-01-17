'use client'

import React, { useEffect, useRef } from 'react'
import { ResultCard } from './result-card'
import { useSearch } from '@/hooks/use-search'
import { Skeleton } from '@/components/ui/skeleton'
import { useInView } from 'react-intersection-observer'
import { useQueryState, parseAsInteger } from 'nuqs'
import { StatsDialog } from './stats-dialog'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export function ResultList() {
    const { data, isLoading, isError, error } = useSearch()

    // Stats display
    // Stats display
    const stats = data ? (
        <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
                Found {data.estimatedTotalHits.toLocaleString()} results ({data.processingTimeMs}ms)
            </div>
            <StatsDialog />
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

    if (!data) return null

    const pageSize = 20
    const totalPages = Math.ceil(data.estimatedTotalHits / pageSize)

    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const pages = []
        // Simple logic: always show 1, ..., current-1, current, current+1, ..., last
        // But let's stick to a robust simple window for now
        // 1 2 3 4 5 ... 10
        // 1 ... 4 5 6 ... 10
        // 1 ... 6 7 8 9 10

        const showMax = 5;
        // Logic: Try to center current page
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, startPage + showMax - 1);

        // Adjust if we hit the end
        if (endPage - startPage + 1 < showMax) {
            startPage = Math.max(1, endPage - showMax + 1);
        }

        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('ellipsis');
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    }

    const pageNumbers = getPageNumbers()

    return (
        <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            if (page > 1) setPage(page - 1)
                        }}
                        aria-disabled={page <= 1}
                        className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                {pageNumbers.map((p, i) => (
                    <PaginationItem key={i}>
                        {p === 'ellipsis' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                href="#"
                                isActive={page === p}
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPage(p as number)
                                }}
                            >
                                {p}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault()
                            if (page < totalPages) setPage(page + 1)
                        }}
                        aria-disabled={page >= totalPages}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}
