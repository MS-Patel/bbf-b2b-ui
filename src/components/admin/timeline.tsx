import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TimelineTone = "success" | "warning" | "destructive" | "info" | "muted";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  tone?: TimelineTone;
  icon?: ReactNode;
}

const DOT: Record<TimelineTone, string> = {
  success: "bg-success ring-success/30",
  warning: "bg-warning ring-warning/30",
  destructive: "bg-destructive ring-destructive/30",
  info: "bg-info ring-info/30",
  muted: "bg-muted-foreground/60 ring-border",
};

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("relative space-y-5 pl-6", className)}>
      <span className="absolute left-[10px] top-1.5 bottom-1.5 w-px bg-border" aria-hidden />
      {items.map((item) => {
        const tone = item.tone ?? "muted";
        return (
          <li key={item.id} className="relative">
            <span
              className={cn(
                "absolute -left-[18px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4",
                DOT[tone],
              )}
            >
              {item.icon}
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium leading-tight">{item.title}</p>
                {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
              </div>
              {item.body && <div className="mt-1 text-sm text-muted-foreground">{item.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
