'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { FilterSidebar } from './filter-sidebar'

export function MobileFilter() {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 px-4">
                    <FilterSidebar />
                </div>
            </SheetContent>
        </Sheet>
    )
}
