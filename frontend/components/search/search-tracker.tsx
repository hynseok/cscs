'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function SearchTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    if (!qs || qs.trim() === '') return;

    const timer = setTimeout(() => {
      // Call the internal Next.js API route to proxy the request securely
      fetch(`/api/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: qs }),
      }).catch((e) => console.error("Search tracking failed:", e));
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return null;
}
