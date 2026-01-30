import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { SearchHeader } from '@/components/search/search-header'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Suspense fallback={<div className="h-20 border-b bg-background/95" />}>
                <SearchHeader />
            </Suspense>
            <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-primary tracking-tighter">404</h1>
                    <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
                </div>
                <p className="text-muted-foreground max-w-[500px]">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or possibly never existed.
                </p>
                <div className="flex gap-4">
                    <Button asChild>
                        <Link href="/">
                            Return Home
                        </Link>
                    </Button>
                </div>
            </main>
        </div>
    )
}
