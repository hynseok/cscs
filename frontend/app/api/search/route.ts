import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    // Construct the target URL securely
    const targetUrl = new URL('/search', backendUrl);
    searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    try {
        const res = await fetch(targetUrl.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Ensure fresh data for search
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: 'Backend error' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
