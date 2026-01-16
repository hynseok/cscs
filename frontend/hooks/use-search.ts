import { useQuery } from '@tanstack/react-query'
import { useQueryState, parseAsString, parseAsArrayOf, parseAsInteger } from 'nuqs'

export interface Paper {
    id: number
    title: string
    authors: string[]
    venue: string
    year: number
    ee_link: string
    _formatted?: {
        title: string
        venue: string
        authors: string[]
        year: string | number
    }
}

export interface SearchResponse {
    hits: Paper[]
    estimatedTotalHits: number
    processingTimeMs: number
    facetDistribution?: {
        venue?: Record<string, number>
        year?: Record<string, number>
    } | null
}

export function useSearch() {
    const [q] = useQueryState('q', parseAsString.withDefault(''))
    const [venue] = useQueryState('venue', parseAsArrayOf(parseAsString).withDefault([]))
    const [year] = useQueryState('year', parseAsArrayOf(parseAsString).withDefault([]))
    const [page] = useQueryState('page', parseAsInteger.withDefault(1))
    const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('relevance'))

    const searchParams = {
        q,
        venue,
        year,
        page,
        sort
    }

    const query = useQuery<SearchResponse>({
        queryKey: ['search', searchParams],
        queryFn: async () => {
            // Build query string manually to handle arrays correctly (comma separated or repeated?)
            // Standard URLSearchParams handles repeated keys.
            // Next.js Proxy expects them as is.
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            venue.forEach(v => params.append('venue', v))
            year.forEach(y => params.append('year', y))
            params.set('page', page.toString())
            if (sort === 'year') {
                params.set('sort', 'year')
            }

            // Request facets explicitly as comma separated string for backend
            params.set('facets', 'venue,year')

            const res = await fetch(`/api/search?${params.toString()}`)
            if (!res.ok) throw new Error('Network response was not ok')
            return res.json()
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    return {
        ...query,
        searchParams,
        sort,
        setSort
    }
}
