'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Paper } from '@/hooks/use-search'
import { generateFallbackBibtex } from '@/components/search/bibtex-dialog'

interface GeminiContextType {
    isOpen: boolean
    isLoading: boolean
    response: string
    activePaper: Paper | null
    openGemini: (paper: Paper) => void
    closeGemini: () => void
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined)

export function GeminiProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState('')
    const [activePaper, setActivePaper] = useState<Paper | null>(null)

    const openGemini = async (paper: Paper) => {
        if (activePaper?.id === paper.id && isOpen) return; // Already open for this paper

        setIsOpen(true)
        setActivePaper(paper)
        setResponse('')
        setIsLoading(true)

        try {
            // Prioritize fetching DBLP bibtex, fallback to generated
            let bibtex = ''
            const dblpKey = paper.dblp_key || paper._formatted?.dblp_key

            if (dblpKey) {
                try {
                    const res = await fetch(`https://dblp.org/rec/${dblpKey}.bib`)
                    if (res.ok) {
                        bibtex = await res.text()
                    }
                } catch (e) {
                    console.error("Failed to fetch DBLP bibtex", e)
                }
            }

            if (!bibtex) {
                bibtex = generateFallbackBibtex(paper)
            }

            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bibtex }),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                console.error("Gemini API responding with error:", errData)
                throw new Error(errData.error || 'Failed to fetch gemini response')
            }

            if (!res.body) throw new Error('Response body is empty')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            setIsLoading(false) // Start streaming

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value)
                setResponse(prev => prev + chunk)
            }

        } catch (error) {
            console.error(error)
            setResponse('Sorry, an error occurred while processing your request.')
            setIsLoading(false)
        }
    }

    const closeGemini = () => {
        setIsOpen(false)
        // We might want to keep the state in case they reopen? 
        // For now let's reset to keep it simple or maybe just keep history?
        // Let's keep the activePaper for now so if they toggle back it's there.
    }

    return (
        <GeminiContext.Provider value={{ isOpen, isLoading, response, activePaper, openGemini, closeGemini }}>
            {children}
        </GeminiContext.Provider>
    )
}

export function useGemini() {
    const context = useContext(GeminiContext)
    if (context === undefined) {
        throw new Error('useGemini must be used within a GeminiProvider')
    }
    return context
}
