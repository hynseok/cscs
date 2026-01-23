export interface Paper {
    id: number
    title: string
    authors: string[]
    venue: string
    year: number
    ee_link: string
    dblp_key: string
    citation_count?: number
    _formatted?: {
        title: string
        venue: string
        authors: string[]
        year: string | number
        dblp_key?: string
        citation_count?: number
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

export async function searchPapers(params: Record<string, string | string[] | number | null>): Promise<SearchResponse> {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const targetUrl = new URL('/search', backendUrl);

    // Add query params
    if (params.q) targetUrl.searchParams.set('q', String(params.q));

    // Handle arrays (venue, year)
    if (Array.isArray(params.venue)) {
        params.venue.forEach(v => targetUrl.searchParams.append('venue', String(v)));
    } else if (params.venue) {
        targetUrl.searchParams.append('venue', String(params.venue));
    }

    if (Array.isArray(params.year)) {
        params.year.forEach(y => targetUrl.searchParams.append('year', String(y)));
    } else if (params.year) {
        targetUrl.searchParams.append('year', String(params.year));
    }

    if (params.page) targetUrl.searchParams.set('page', String(params.page));
    if (params.sort) targetUrl.searchParams.set('sort', String(params.sort));

    // Always request facets
    targetUrl.searchParams.set('facets', 'venue,year');

    console.log(`[SSR] Fetching: ${targetUrl.toString()}`);

    const res = await fetch(targetUrl.toString(), {
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fresh for search
    });

    if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
    }

    return res.json();
}
