import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReviewField {
  label: string;
  value: string;
  status?: "ok" | "missing" | "warning";
}

export interface ReviewSectionCardProps {
  title: string;
  status: "complete" | "incomplete" | "warning";
  fields: ReviewField[];
  errorCount?: number;
  onJump: () => void;
  defaultOpen?: boolean;
}

export function ReviewSectionCard({ title, status, fields, errorCount = 0, onJump, defaultOpen }: ReviewSectionCardProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const Icon = status === "complete" ? CheckCircle2 : AlertCircle;
  const iconCls =
    status === "complete" ? "text-success" : status === "warning" ? "text-warning" : "text-destructive";
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-secondary/40"
      >
        <span className="flex items-center gap-3">
          <Icon className={cn("h-4 w-4", iconCls)} />
          <span className="text-sm font-semibold">{title}</span>
          {errorCount > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              {errorCount} issue{errorCount > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {fields.length} fields
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-border bg-background/40">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
            {fields.map((f, i) => (
              <div key={i} className="flex items-start justify-between gap-3 border-b border-dashed border-border/60 pb-2 last:border-0">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className={cn("text-right text-sm font-medium tabular-nums", f.status === "missing" && "text-destructive", f.status === "warning" && "text-warning")}>
                  {f.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-end border-t border-border px-5 py-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={onJump}>
              Jump to section <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
