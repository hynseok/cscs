'use client'

import { useEffect } from 'react'

export function SearchTracker({ q }: { q: string }) {
  useEffect(() => {
    if (!q || q.trim() === '') return;

    const timer = setTimeout(() => {
      // Call the internal Next.js API route to proxy the request securely
      fetch(`/api/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      }).catch((e) => console.error("Search tracking failed:", e));
    }, 5000);

    return () => clearTimeout(timer);
  }, [q]);

  return null;
}
