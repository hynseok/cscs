'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VENUE_FIELDS } from '@/constants/venue-categories'
import { VENUE_FULL_NAMES } from '@/constants/venue-names'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface VenueFilterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedVenues: string[]
    onApply: (venues: string[]) => void
    venueCounts: Record<string, number>
}

// Group venues by field logic
function getVenuesByField(venueCounts: Record<string, number>) {
    const groups: Record<string, string[]> = {}
    const otherVenues: string[] = []

    // 1. Initialize groups from constants
    const predefinedVenues = new Set<string>()
    Object.entries(VENUE_FIELDS).forEach(([venue, field]) => {
        if (!groups[field]) groups[field] = []
        // We only add venues that actually exist in the current search results or keys
        // But the user might want to see all potential venues? 
        // Typically facets only show what's available. 
        // Let's iterate available venues and match them to fields.
    })

    // 2. Map available venues to fields
    // Sort VENUE_FIELDS keys by length descending to ensure "ICSE" is matched before "ICS"
    const sortedKeys = Object.keys(VENUE_FIELDS).sort((a, b) => b.length - a.length)

    Object.keys(venueCounts).forEach(venue => {
        let found = false
        const upperVenue = venue.toUpperCase()

        for (const key of sortedKeys) {
            const field = VENUE_FIELDS[key]
            // Check exact match or starts with for variations involving years (e.g. "CVPR '23")
            // The provided VENUE_FIELDS keys are short codes (CVPR).
            // Usually facet values are "CVPR", "ICLR", etc.

            // We can also try to be smarter: key must match a word boundary or be the whole string
            // But simple length priority usually solves the "substring inside another key" issue.
            if (upperVenue.includes(key.toUpperCase())) {
                if (!groups[field]) groups[field] = []
                groups[field].push(venue)
                found = true
                break
            }
        }

        if (!found) {
            otherVenues.push(venue)
        }
    })

    // Sort fields alphabetically
    const sortedGroups = Object.entries(groups)
        .filter(([_, venues]) => venues.length > 0)
        .sort((a, b) => a[0].localeCompare(b[0]))

    // Sort venues within groups by count (desc) then name
    sortedGroups.forEach(([_, venues]) => {
        venues.sort((a, b) => {
            const countDiff = (venueCounts[b] || 0) - (venueCounts[a] || 0)
            if (countDiff !== 0) return countDiff
            return a.localeCompare(b)
        })
    })

    otherVenues.sort((a, b) => {
        const countDiff = (venueCounts[b] || 0) - (venueCounts[a] || 0)
        if (countDiff !== 0) return countDiff
        return a.localeCompare(b)
    })

    if (otherVenues.length > 0) {
        sortedGroups.push(['Other', otherVenues])
    }

    return sortedGroups
}

export function VenueFilterDialog({
    open,
    onOpenChange,
    selectedVenues,
    onApply,
    venueCounts,
}: VenueFilterDialogProps) {
    // Local state for selections before applying
    const [localSelected, setLocalSelected] = React.useState<Set<string>>(new Set(selectedVenues))

    // Sync when dialog opens
    React.useEffect(() => {
        if (open) {
            setLocalSelected(new Set(selectedVenues))
        }
    }, [open, selectedVenues])

    const groupedVenues = React.useMemo(() => getVenuesByField(venueCounts), [venueCounts])

    const toggleVenue = (venue: string) => {
        const newSet = new Set(localSelected)
        if (newSet.has(venue)) {
            newSet.delete(venue)
        } else {
            newSet.add(venue)
        }
        setLocalSelected(newSet)
    }

    const toggleCategory = (venues: string[]) => {
        const newSet = new Set(localSelected)
        const allSelected = venues.every(v => newSet.has(v))

        if (allSelected) {
            // Deselect all
            venues.forEach(v => newSet.delete(v))
        } else {
            // Select all
            venues.forEach(v => newSet.add(v))
        }
        setLocalSelected(newSet)
    }

    const handleApply = () => {
        onApply(Array.from(localSelected))
        onOpenChange(false)
    }

    const totalSelected = localSelected.size

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Filter by Venue</span>
                        {totalSelected > 0 && (
                            <Badge variant="secondary" className="mr-6">
                                {totalSelected} selected
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Select venues by category to filter your search results.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    <TooltipProvider delayDuration={300}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedVenues.map(([category, venues]) => {
                                const isAllSelected = venues.every(v => localSelected.has(v))
                                const isSomeSelected = venues.some(v => localSelected.has(v))

                                return (
                                    <div key={category} className="space-y-3 break-inside-avoid">
                                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cat-${category}`}
                                                    checked={isAllSelected || (isSomeSelected && "indeterminate")}
                                                    onCheckedChange={() => toggleCategory(venues)}
                                                />
                                                <Label htmlFor={`cat-${category}`} className="font-semibold cursor-pointer">
                                                    {category}
                                                </Label>
                                            </div>
                                            <span className="text-xs text-muted-foreground mr-1">
                                                {venues.length}
                                            </span>
                                        </div>
                                        <div className="pl-2 space-y-2 border-l-2 ml-2 border-muted">
                                            {venues.map(venue => {
                                                const fullName = VENUE_FULL_NAMES[venue]

                                                const content = (
                                                    <div className="flex items-center justify-between group pl-3">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`venue-${venue}`}
                                                                checked={localSelected.has(venue)}
                                                                onCheckedChange={() => toggleVenue(venue)}
                                                            />
                                                            <Label
                                                                htmlFor={`venue-${venue}`}
                                                                className="text-sm cursor-pointer font-normal text-muted-foreground group-hover:text-foreground transition-colors"
                                                            >
                                                                {venue}
                                                            </Label>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground tabular-nums opacity-50 group-hover:opacity-100">
                                                            {venueCounts[venue]}
                                                        </span>
                                                    </div>
                                                )

                                                if (fullName) {
                                                    return (
                                                        <Tooltip key={venue}>
                                                            <TooltipTrigger asChild>
                                                                {content}
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="max-w-[300px] bg-popover text-popover-foreground border shadow-md">
                                                                <p>{fullName}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )
                                                }

                                                return <div key={venue}>{content}</div>
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TooltipProvider>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t gap-2 sm:justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {/* Summary or extra info can go here */}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApply}>
                            Apply Filters
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
