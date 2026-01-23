'use client'

import * as React from 'react'
import { SearchInput } from './search-input'
import { Github } from 'lucide-react'

export function SearchHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-20 items-center px-4 md:px-8 gap-4">
                <a href="/" className="flex flex-col justify-center min-w-fit group">
                    <h1 className="font-bold text-3xl tracking-tight text-primary group-hover:opacity-80 transition-opacity">
                        CSCS
                    </h1>
                    <p className="hidden sm:block text-[10px] text-muted-foreground font-medium uppercase tracking-wider -mt-1">
                        Computer Science Conference paper Searcher
                    </p>
                </a>
                <div className="flex-1 flex justify-start ml-2 md:ml-4">
                    <SearchInput />
                </div>
                <div className="hidden md:flex w-fit min-w-[100px] justify-end">
                    <a
                        href="https://github.com/hynseok/cscs"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Github className="h-5 w-5" />
                        <span className="sr-only">GitHub</span>
                    </a>
                </div>
            </div>
        </header>
    )
}
