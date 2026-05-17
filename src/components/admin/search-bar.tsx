import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchBar({
  value,
  defaultValue = "",
  placeholder = "Search…",
  debounceMs = 250,
  onChange,
  className,
}: SearchBarProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value! : internal;

  useEffect(() => {
    if (!onChange) return;
    const t = setTimeout(() => onChange(current), debounceMs);
    return () => clearTimeout(t);
  }, [current, debounceMs, onChange]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={current}
        onChange={(e) => (controlled ? onChange?.(e.target.value) : setInternal(e.target.value))}
        placeholder={placeholder}
        className="h-9 pl-9 pr-9"
      />
      {current && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => (controlled ? onChange?.("") : setInternal(""))}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
