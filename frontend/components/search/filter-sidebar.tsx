'use client'

import * as React from 'react'
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearch } from '@/hooks/use-search'

export function FilterSidebar() {
    const { data, isLoading } = useSearch()

    // NOTE: If facets are null, we might want to fallback or just show empty.
    // Assuming facets are returned in facetDistribution.
    const venues = data?.facetDistribution?.venue || {}
    const years = data?.facetDistribution?.year || {}

    return (
        <div className="space-y-6">
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
                <h3 className="font-semibold">{title}</h3>
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
                {entries.map(([label, count]) => (
                    <div key={label} className="flex items-center space-x-2">
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
                ))}
            </div>
        </div>
    )
}
