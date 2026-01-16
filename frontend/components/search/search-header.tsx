'use client'

import * as React from 'react'
import { SearchInput } from './search-input'

export function SearchHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-20 items-center px-4 md:px-8 gap-4">
                <a href="/" className="flex flex-col justify-center min-w-fit group">
                    <div className="font-bold text-3xl tracking-tight text-primary group-hover:opacity-80 transition-opacity">
                        CSCS
                    </div>
                    <div className="hidden sm:block text-[10px] text-muted-foreground font-medium uppercase tracking-wider -mt-1">
                        Computer Science Conference paper Searcher
                    </div>
                </a>
                <div className="flex-1 flex justify-start ml-2 md:ml-4">
                    <SearchInput />
                </div>
                <div className="hidden md:flex w-fit min-w-[100px] justify-end">
                    {/* Placeholder for future user menu or stats */}
                </div>
            </div>
        </header>
    )
}
