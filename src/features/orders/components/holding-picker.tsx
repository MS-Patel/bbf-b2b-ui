import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Holding } from "@/types/portfolio";
import { formatINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface HoldingPickerProps {
  holdings: Holding[];
  selectedId?: string;
  onSelect: (holdingId: string) => void;
  /** Optional: filter to a specific asset class (e.g., switch within same AMC). */
  filter?: (h: Holding) => boolean;
}

export function HoldingPicker({ holdings, selectedId, onSelect, filter }: HoldingPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let items = filter ? holdings.filter(filter) : holdings;
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (h) =>
          h.schemeName.toLowerCase().includes(q) ||
          h.amc.toLowerCase().includes(q) ||
          h.category.toLowerCase().includes(q),
      );
    }
    return items;
  }, [holdings, query, filter]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your holdings…"
          className="pl-9"
        />
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/20 p-2">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No holdings match your search.
          </p>
        ) : (
          filtered.map((h) => {
            const selected = h.id === selectedId;
            const positive = h.returnPct >= 0;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelect(h.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-transparent bg-card hover:border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{h.schemeName}</p>
                    {selected && (
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {h.amc} · {h.category}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Units{" "}
                      <span className="font-semibold tabular-nums text-foreground">
                        {h.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                      </span>
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border-0 px-1.5 py-0 text-[10px] font-semibold",
                        positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                      )}
                    >
                      {formatPercent(h.returnPct, 1)}
                    </Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatINR(h.currentValue)}</p>
                  <p className="text-[11px] text-muted-foreground">NAV ₹{h.currentNav.toFixed(2)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
