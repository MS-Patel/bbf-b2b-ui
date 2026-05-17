import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  selectedCount: number;
  onClear?: () => void;
  actions: ReactNode;
  itemLabel?: string;
  className?: string;
  sticky?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  actions,
  itemLabel = "item",
  className,
  sticky = true,
}: BulkActionBarProps) {
  if (selectedCount <= 0) return null;
  return (
    <div
      className={cn(
        "z-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-card backdrop-blur",
        sticky && "sticky bottom-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {onClear && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </Button>
        )}
        <p className="text-sm font-medium">
          <span className="tabular-nums">{selectedCount}</span> {itemLabel}
          {selectedCount === 1 ? "" : "s"} selected
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
