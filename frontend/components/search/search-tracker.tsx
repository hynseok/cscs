'use client'

import { useEffect } from 'react'

export function SearchTracker({ q }: { q: string }) {
  useEffect(() => {
    if (!q || q.trim() === '') return;

    const timer = setTimeout(() => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      
      fetch(`${backendUrl}/seo/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      }).catch((e) => console.error("Search tracking failed:", e));
    }, 5000);

    return () => clearTimeout(timer);
  }, [q]);

  return null;
}
