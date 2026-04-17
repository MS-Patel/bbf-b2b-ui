import { useMemo, useState } from "react";
import { Search, Star, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Scheme } from "@/types/scheme";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SchemePickerProps {
  schemes: Scheme[];
  selectedId?: string;
  onSelect: (schemeId: string) => void;
}

export function SchemePicker({ schemes, selectedId, onSelect }: SchemePickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schemes;
    return schemes.filter(
      (s) =>
        s.schemeName.toLowerCase().includes(q) ||
        s.amc.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [schemes, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search schemes by name, AMC, or category…"
          className="pl-9"
        />
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/20 p-2">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No schemes match your search.</p>
        ) : (
          filtered.map((s) => {
            const selected = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-transparent bg-card hover:border-border hover:bg-card",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{s.schemeName}</p>
                    {selected && (
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.amc} · {s.category}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      NAV <span className="font-semibold tabular-nums text-foreground">₹{s.nav.toFixed(2)}</span>
                    </span>
                    <span className="text-profit font-semibold tabular-nums">
                      1Y {formatPercent(s.return1y, 1)}
                    </span>
                    <Badge variant="secondary" className="gap-0.5 border-0 px-1.5 py-0 text-[10px]">
                      <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                      {s.rating}
                    </Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                  Min ₹{s.minLumpsum.toLocaleString("en-IN")}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
