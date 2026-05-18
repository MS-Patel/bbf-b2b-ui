import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerTone = "error" | "warning" | "info" | "success";

export interface ValidationBannerProps {
  tone: BannerTone;
  title: string;
  description?: ReactNode;
  items?: string[];
  actions?: ReactNode;
  className?: string;
}

const TONE: Record<BannerTone, { wrap: string; icon: typeof AlertCircle; iconCls: string }> = {
  error: { wrap: "border-destructive/30 bg-destructive/5 text-destructive", icon: AlertCircle, iconCls: "text-destructive" },
  warning: { wrap: "border-warning/30 bg-warning/5", icon: AlertTriangle, iconCls: "text-warning" },
  info: { wrap: "border-info/30 bg-info/5", icon: Info, iconCls: "text-info" },
  success: { wrap: "border-success/30 bg-success/5", icon: CheckCircle2, iconCls: "text-success" },
};

export function ValidationBanner({ tone, title, description, items, actions, className }: ValidationBannerProps) {
  const t = TONE[tone];
  const Icon = t.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", t.wrap, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.iconCls)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
        {items && items.length > 0 && (
          <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
            {items.map((it, i) => (<li key={i}>{it}</li>))}
          </ul>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
