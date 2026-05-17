import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface InfoDrawerSection {
  id: string;
  title?: string;
  content: ReactNode;
}

export interface InfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  sections: InfoDrawerSection[];
  footer?: ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function InfoDrawer({
  open,
  onOpenChange,
  title,
  description,
  sections,
  footer,
  side = "right",
  className,
}: InfoDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("flex w-full flex-col gap-0 p-0 sm:max-w-lg", className)}>
        <SheetHeader className="border-b border-border bg-secondary/30 px-6 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.id} className="space-y-2">
                {s.title && (
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.title}
                  </h3>
                )}
                <div className="text-sm">{s.content}</div>
              </section>
            ))}
          </div>
        </div>
        {footer && <div className="border-t border-border bg-card px-6 py-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
