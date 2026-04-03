import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
        
        // Proxy the request from Next.js Server to the internal Rust Backend
        await fetch(`${backendUrl}/seo/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Failed to proxy SEO search query', e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
