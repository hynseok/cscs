import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'
import crypto from 'crypto'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Initialize Redis 
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')

export async function POST(req: NextRequest) {
    try {
        const { bibtex } = await req.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 })
        }

        // Cache Key Generation using MD5 hash of bibtex for shorter keys
        const hash = crypto.createHash('md5').update(bibtex).digest('hex')
        const cacheKey = `gemini:explanation:${hash}`

        // 1. Check Cache
        const cached = await redis.get(cacheKey)
        if (cached) {
            // Return cached response as stream for consistency on client side
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(cached))
                    controller.close()
                }
            })
            return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Cache': 'HIT' } })
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        const prompt = `
Please provide a concise explanation of this paper in English.

Structure your response with clear Markdown formatting:

## Summary
A one-sentence summary of what this paper proposes.

## Core Contribution
A bulleted list of key technical contributions.

## Impact
Why this paper is important or what problem it solves.

**Note**: Use bolding for key terms. Ensure there is a blank line between sections and paragraphs for readability.

Here is the BibTeX for a computer science paper:
\`\`\`bibtex
${bibtex}
\`\`\`
`

        const result = await model.generateContentStream(prompt)

        // 2. Stream & Cache Strategy
        const { stream: originalStream } = result

        // Use Tee to split stream? 
        // Google's stream isn't a standard ReadableStream yet, it's an async iterable.
        // We create a TransformStream or just a custom ReadableStream that accumulates data.

        let fullText = ''
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of originalStream) {
                    const chunkText = chunk.text()
                    if (chunkText) {
                        fullText += chunkText
                        controller.enqueue(encoder.encode(chunkText))
                    }
                }
                controller.close()

                // 3. Save to Redis on completion
                if (fullText) {
                    await redis.set(cacheKey, fullText, 'EX', 60 * 60 * 24 * 30) // 30 days
                }
            }
        })

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Cache': 'MISS'
            },
        })

    } catch (error: any) {
        console.error('Gemini API Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to process request',
            details: JSON.stringify(error)
        }, { status: 500 })
    }
}
