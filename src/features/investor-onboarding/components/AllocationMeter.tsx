import { cn } from "@/lib/utils";

export interface AllocationMeterProps {
  segments: { id: string; label: string; value: number }[];
  total?: number; // default 100
  className?: string;
}

const PALETTE = ["bg-primary", "bg-info", "bg-success", "bg-warning", "bg-accent"];

export function AllocationMeter({ segments, total = 100, className }: AllocationMeterProps) {
  const sum = segments.reduce((s, x) => s + (Number.isFinite(x.value) ? x.value : 0), 0);
  const remaining = Math.max(0, total - sum);
  const over = sum > total;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Allocation</span>
        <span className={cn("font-semibold tabular-nums", over ? "text-destructive" : sum === total ? "text-success" : "text-foreground")}>
          {sum.toFixed(0)}% / {total}%
        </span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s, i) => {
          const pct = Math.max(0, Math.min(100, (s.value / total) * 100));
          if (pct <= 0) return null;
          return <span key={s.id} className={cn(over ? "bg-destructive" : PALETTE[i % PALETTE.length])} style={{ width: `${pct}%` }} title={`${s.label}: ${s.value}%`} />;
        })}
        {!over && remaining > 0 && <span className="bg-transparent" style={{ width: `${(remaining / total) * 100}%` }} />}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {segments.map((s, i) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-sm", over ? "bg-destructive" : PALETTE[i % PALETTE.length])} />
            <span className="truncate">{s.label || "—"}</span>
            <span className="tabular-nums">{s.value || 0}%</span>
          </span>
        ))}
        {remaining > 0 && !over && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/30" />
            <span>Unallocated</span>
            <span className="tabular-nums">{remaining}%</span>
          </span>
        )}
      </div>
    </div>
  );
}
