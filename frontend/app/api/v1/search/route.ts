import { NextRequest, NextResponse } from 'next/server';

// Public, CORS-open search API. Decoupled from the internal /api/search proxy
// (which returns the raw Meilisearch shape used by our own UI) so we can keep a
// stable, documented response contract for external consumers.
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// Fields returned by the backend for each hit (see backend PaperHit).
interface BackendHit {
    id: number;
    title: string;
    authors: string[];
    venue: string;
    year: number;
    ee_link?: string | null;
    dblp_key: string;
    citation_count?: number;
    abstract_text?: string | null;
}

// Preflight for cross-origin browser clients.
export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
    const inParams = request.nextUrl.searchParams;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const targetUrl = new URL('/search', backendUrl);

    const q = inParams.get('q') ?? '';
    const page = Math.max(1, parseInt(inParams.get('page') ?? '1', 10) || 1);
    const rawLimit = parseInt(inParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
    const sort = inParams.get('sort');

    // Only forward a known, safe subset of params to the backend.
    if (q) targetUrl.searchParams.set('q', q);
    inParams.getAll('venue').forEach((v) => targetUrl.searchParams.append('venue', v));
    inParams.getAll('year').forEach((y) => targetUrl.searchParams.append('year', y));
    targetUrl.searchParams.set('page', String(page));
    targetUrl.searchParams.set('limit', String(limit));
    if (sort) targetUrl.searchParams.set('sort', sort);

    try {
        const res = await fetch(targetUrl.toString(), {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: 'Backend error' },
                { status: res.status, headers: CORS_HEADERS }
            );
        }

        const data = await res.json();

        const results = Array.isArray(data.hits)
            ? data.hits.map((h: BackendHit) => ({
                id: h.id,
                title: h.title,
                authors: h.authors,
                venue: h.venue,
                year: h.year,
                citation_count: h.citation_count ?? 0,
                url: h.ee_link ?? null,
                dblp_key: h.dblp_key,
                abstract: h.abstract_text ?? null,
            }))
            : [];

        return NextResponse.json(
            {
                query: q,
                page,
                limit,
                total: data.estimatedTotalHits ?? results.length,
                count: results.length,
                results,
            },
            { headers: CORS_HEADERS }
        );
    } catch (error) {
        console.error('Public API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
