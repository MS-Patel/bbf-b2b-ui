import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "destructive" | "info" | "muted";

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  dot?: boolean;
  className?: string;
}

const TONE_STYLES: Record<StatusTone, string> = {
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
  destructive: "bg-destructive/12 text-destructive ring-destructive/20",
  info: "bg-info/12 text-info ring-info/20",
  muted: "bg-muted text-muted-foreground ring-border",
};

const DOT_STYLES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

export function StatusBadge({ tone, label, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[tone])} />}
      {label}
    </span>
  );
}
