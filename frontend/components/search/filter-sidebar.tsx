'use client'

import * as React from 'react'
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useSearch } from '@/hooks/use-search'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { VENUE_FULL_NAMES } from '@/constants/venue-names'
import { VenueFilterDialog } from './venue-filter-dialog'


export function FilterSidebar() {
    const { data, isLoading, sort, setSort } = useSearch()

    // NOTE: If facets are null, we might want to fallback or just show empty.
    // Assuming facets are returned in facetDistribution.
    const venues = data?.facetDistribution?.venue || {}
    const years = data?.facetDistribution?.year || {}

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="font-semibold">Sort by</h3>
                <div className="flex flex-col space-y-1">
                    <button
                        onClick={() => setSort('relevance')}
                        className={cn("text-sm text-left px-2 py-1.5 rounded-md transition-colors", sort === 'relevance' ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}
                    >
                        Relevance
                    </button>
                    <button
                        onClick={() => setSort('year')}
                        className={cn("text-sm text-left px-2 py-1.5 rounded-md transition-colors", sort === 'year' ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}
                    >
                        Date
                    </button>
                    <button
                        onClick={() => setSort('citation_count')}
                        className={cn("text-sm text-left px-2 py-1.5 rounded-md transition-colors", sort === 'citation_count' ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}
                    >
                        Citation Count
                    </button>
                </div>
            </div>
            <Separator />
            <FilterSection
                title="Venue"
                paramKey="venue"
                options={venues}
                isLoading={isLoading}
            />
            <FilterSection
                title="Year"
                paramKey="year"
                options={years}
                isLoading={isLoading}
                sortDesc
            />
        </div>
    )
}

function FilterSection({
    title,
    paramKey,
    options,
    isLoading,
    sortDesc = false
}: {
    title: string
    paramKey: string
    options: Record<string, number>
    isLoading: boolean
    sortDesc?: boolean
}) {
    const [selected, setSelected] = useQueryState(
        paramKey,
        parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: false, history: 'push' })
    )

    const entries = Object.entries(options).sort((a, b) => {
        if (sortDesc) return b[0].localeCompare(a[0])
        return a[0].localeCompare(b[0])
    })

    const toggle = (value: string) => {
        if (selected.includes(value)) {
            setSelected(selected.filter(s => s !== value) || null)
        } else {
            setSelected([...selected, value])
        }
    }

    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // Sync dialog selection with URL params when dialog is open
    // When applying, we just update the URL params using setSelected

    // We pass the venues record to the dialog so it knows counts and can populate the list

    const handleDialogApply = (newVenues: string[]) => {
        setSelected(newVenues.length > 0 ? newVenues : null)
    }

    if (isLoading && entries.length === 0) {
        return (
            <div className="space-y-3">
                <h3 className="font-semibold">{title}</h3>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        )
    }

    if (entries.length === 0) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{title}</h3>
                    {paramKey === 'venue' && (
                        <>
                            <button
                                onClick={() => setIsDialogOpen(true)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
                                title="Detailed Venue Filter"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-filter"><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></svg>
                            </button>
                            <VenueFilterDialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                                selectedVenues={selected}
                                onApply={handleDialogApply}
                                venueCounts={options}
                            />
                        </>
                    )}
                </div>
                {selected.length > 0 && (
                    <button
                        onClick={() => setSelected(null)}
                        className="text-xs text-muted-foreground hover:text-primary"
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <TooltipProvider delayDuration={300}>
                    {entries.map(([label, count]) => {
                        const fullName = paramKey === 'venue' ? VENUE_FULL_NAMES[label] : null

                        const content = (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${paramKey}-${label}`}
                                    checked={selected.includes(label)}
                                    onCheckedChange={() => toggle(label)}
                                />
                                <Label
                                    htmlFor={`${paramKey}-${label}`}
                                    className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex justify-between"
                                >
                                    <span>{label}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{count}</span>
                                </Label>
                            </div>
                        )

                        if (fullName) {
                            return (
                                <Tooltip key={label}>
                                    <TooltipTrigger asChild>
                                        {content}
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[300px] bg-popover text-popover-foreground border shadow-md">
                                        <p>{fullName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }

                        return <div key={label}>{content}</div>
                    })}
                </TooltipProvider>
            </div>
        </div>
    )
}

