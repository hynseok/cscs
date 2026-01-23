import * as React from 'react'
import { FilterSidebar } from '@/components/search/filter-sidebar'
import { ResultList } from '@/components/search/result-list'
import { SearchHeader } from '@/components/search/search-header'
import { MobileFilter } from '@/components/search/mobile-filter'
import { ScrollToTop } from '@/components/search/scroll-to-top'
import { Suspense } from 'react'
import { searchPapers } from '@/lib/search-client'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

export default async function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.searchParams

  // Helpers to match nuqs parsing behavior
  const normalizeString = (param: string | string[] | undefined) => {
    if (!param) return ''
    if (Array.isArray(param)) return param[0] || ''
    return param
  }

  const normalizeArray = (param: string | string[] | undefined) => {
    if (!param) return []
    if (Array.isArray(param)) return param
    return param.split(',').filter(p => p.length > 0)
  }

  const normalizeInt = (param: string | string[] | undefined, fallback: number) => {
    if (!param) return fallback
    const val = Array.isArray(param) ? param[0] : param
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? fallback : parsed
  }

  const q = normalizeString(params.q)
  const venue = normalizeArray(params.venue)
  const year = normalizeArray(params.year)
  const page = normalizeInt(params.page, 1)
  const sort = normalizeString(params.sort) || 'relevance'

  const searchState = {
    q,
    venue,
    year,
    page,
    sort
  }

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['search', searchState],
    queryFn: () => searchPapers(searchState),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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
    </HydrationBoundary>
  )
}
