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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for papers (e.g., 'kernel')..."
        className="pl-9 h-12 text-lg shadow-sm"
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
