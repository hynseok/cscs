import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
    return (
        <footer className={cn("border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
            <div className="container flex flex-col items-center justify-center gap-4 py-6 md:h-14 md:py-0">
                <p className="text-center text-sm leading-loose text-muted-foreground">
                    Copyright &copy; 2026 <span className="font-medium text-foreground">hynseok</span>. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
