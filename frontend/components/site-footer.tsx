import { Github } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
    return (
        <footer className={cn("border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-14 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0 md:pl-8">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Copyright &copy; 2026 <span className="font-medium text-foreground">hynseok</span>. All rights reserved.
                    </p>
                </div>
                <div className="flex items-center gap-4 px-8 md:px-0">
                    <Link
                        href="https://github.com/hynseok/cscs"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4"
                    >
                        <Github className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}
