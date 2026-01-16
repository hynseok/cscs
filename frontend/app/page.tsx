'use client'

import * as React from 'react'
import { FilterSidebar } from '@/components/search/filter-sidebar'
import { ResultList } from '@/components/search/result-list'
import { SearchHeader } from '@/components/search/search-header'
import { MobileFilter } from '@/components/search/mobile-filter'
import { ScrollToTop } from '@/components/search/scroll-to-top'
import { Suspense } from 'react'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Loading search...</div>}>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-background">
        <SearchHeader />
        <main className="flex flex-1 flex-col md:flex-row gap-6 p-4 md:gap-8 md:p-8">
          <aside className="hidden w-64 flex-col gap-4 md:flex">
            <FilterSidebar />
          </aside>
          <div className="flex-1 space-y-4">
            <div className="md:hidden">
              <MobileFilter />
            </div>
            <ResultList />
          </div>
        </main>
      </div>
    </Suspense>
  )
}
