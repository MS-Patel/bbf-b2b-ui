import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  density?: "default" | "compact";
}

export function SectionCard({ title, description, aside, children, className, footer, density = "default" }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border", density === "compact" ? "px-4 py-3" : "px-5 py-4")}>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
      </header>
      <div className={cn(density === "compact" ? "p-4" : "p-5")}>{children}</div>
      {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">{footer}</footer>}
    </section>
  );
}
