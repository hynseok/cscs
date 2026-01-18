'use client'

import React from 'react'
import { useGemini } from '@/context/gemini-context'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function GeminiPanel() {
    const { isOpen, closeGemini, isLoading, response, activePaper } = useGemini()

    // Using `hidden md:flex` logic if we want it strictly unrelated to normal flow,
    // but user asked for "right sidebar", so we will likely place it in the grid.

    // For Fixed Position implementation (Overlay style or pushing content):
    // If we want it to occupy space ("right margin"), we should put it in the layout.
    // Let's make it a fixed sidebar on the right that slides in.

    return (
        <div
            className={cn(
                "fixed top-0 right-0 bottom-0 w-[400px] bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="flex items-center justify-between px-4 pt-5.5 pb-5.5 border-b">
                <div className="flex items-center gap-2 text-primary font-semibold">
                    <Sparkles className="w-5 h-5" />
                    Gemini Insight
                </div>
                <Button variant="ghost" size="icon" onClick={closeGemini}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activePaper ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold leading-tight">{activePaper.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {activePaper.venue} {activePaper.year}
                            </p>
                        </div>

                        {isLoading && !response && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm">Analysing paper...</p>
                            </div>
                        )}

                        {response && (
                            <div className="text-sm">
                                <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h2: ({ ...props }) => <h2 className="text-lg font-bold mt-8 mb-3 text-primary border-b pb-1" {...props} />,
                                        p: ({ ...props }) => <p className="leading-7 mb-4 text-foreground/90" {...props} />,
                                        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                        li: ({ ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                                        strong: ({ ...props }) => <strong className="font-semibold text-foreground underline decoration-primary/30 underline-offset-2" {...props} />,
                                    }}
                                >
                                    {response}
                                </Markdown>
                            </div>
                        )}

                        {!isLoading && !response && (
                            <div className="text-muted-foreground text-sm">
                                Ready to analyze.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a paper to get AI-powered insights.</p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t bg-muted/20 text-[10px] text-center text-muted-foreground">
                AI-generated content may be inaccurate.
            </div>
        </div>
    )
}
