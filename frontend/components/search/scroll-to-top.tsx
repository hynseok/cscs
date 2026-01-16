'use client'

import { useEffect } from 'react'
import { useSearch } from '@/hooks/use-search'

export function ScrollToTop() {
    // Destructure all params that should trigger a scroll
    const { sort, searchParams } = useSearch()
    const { q, venue, year, page } = searchParams

    useEffect(() => {
        // Scroll to top whenever any of these change
        window.scrollTo({ top: 0, behavior: 'smooth' }) // or 'auto' if prefer instant
    }, [q, venue, year, page, sort])

    return null
}
