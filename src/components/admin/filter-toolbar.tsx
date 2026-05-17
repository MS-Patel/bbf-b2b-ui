import type { ReactNode } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  activeCount?: number;
  onReset?: () => void;
  className?: string;
}

export function FilterToolbar({ search, filters, actions, activeCount = 0, onReset, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:items-center md:gap-2",
        className,
      )}
    >
      {search && <div className="min-w-0 flex-1 md:max-w-sm">{search}</div>}
      {filters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground md:block" />
          {filters}
          {activeCount > 0 && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Reset ({activeCount})
            </Button>
          )}
        </div>
      )}
      {actions && <div className="flex flex-wrap items-center gap-2 md:ml-auto">{actions}</div>}
    </div>
  );
}
