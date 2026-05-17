import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KPIWidgetProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; direction: "up" | "down" | "flat"; tone?: "positive" | "negative" | "neutral" };
  icon?: LucideIcon;
  hint?: string;
  trend?: ReactNode;
  className?: string;
}

export function KPIWidget({ label, value, delta, icon: Icon, hint, trend, className }: KPIWidgetProps) {
  const deltaTone =
    delta?.tone ?? (delta?.direction === "up" ? "positive" : delta?.direction === "down" ? "negative" : "neutral");
  const toneCls =
    deltaTone === "positive"
      ? "text-success bg-success/10"
      : deltaTone === "negative"
        ? "text-destructive bg-destructive/10"
        : "text-muted-foreground bg-muted";
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
          </div>
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          {delta ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", toneCls)}>
              {delta.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : delta.direction === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {delta.value}
            </span>
          ) : <span />}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        {trend && <div className="h-10">{trend}</div>}
      </CardContent>
    </Card>
  );
}
