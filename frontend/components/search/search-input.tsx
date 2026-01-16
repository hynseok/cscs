"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function SearchInput() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );
  const [value, setValue] = React.useState(q);
  const debouncedValue = useDebounce(value, 200);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync local state with URL if URL changes externally
  React.useEffect(() => {
    setValue(q);
  }, [q]);

  // Sync Debounced value to URL
  React.useEffect(() => {
    if (debouncedValue !== q) {
      setQ(debouncedValue || null);
    }
  }, [debouncedValue, setQ, q]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="relative w-full max-w-3xl group">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search for papers..."
        className="pl-9 pr-14 h-12 text-lg shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
        value={value}
        onChange={handleChange}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1">
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
