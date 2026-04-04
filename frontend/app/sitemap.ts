import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'

    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ]

    try {
        const res = await fetch(`${backendUrl}/seo/sitemap`, { cache: 'no-store' })
        if (res.ok) {
            const queries: string[] = await res.json()
            for (const query of queries) {
                // If it contains '=', it's a full query string (e.g. venue=AAAI&q=Spiking)
                // Otherwise it's the old single-keyword format
                const queryString = query.includes('=') ? query : `q=${encodeURIComponent(query)}`
                
                routes.push({
                    url: `${baseUrl}/?${queryString}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                })
            }
        }
    } catch (e) {
        console.error('Failed to fetch SEO sitemap queries', e)
    }

    return routes
}
