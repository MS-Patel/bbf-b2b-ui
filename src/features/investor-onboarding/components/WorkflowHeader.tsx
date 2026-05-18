import { Save, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/feedback/status-badge";

export interface WorkflowHeaderProps {
  draftId: string;
  lastSavedAt?: string;
  isDirty: boolean;
  onSaveDraft: () => void;
  onExit: () => void;
}

function formatSavedAgo(iso?: string): string {
  if (!iso) return "Not saved yet";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.round(diff / 1000));
  if (s < 60) return `Saved ${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `Saved ${m} min ago`;
  const h = Math.round(m / 60);
  return `Saved ${h}h ago`;
}

export function WorkflowHeader({ draftId, lastSavedAt, isDirty, onSaveDraft, onExit }: WorkflowHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/60 px-6 py-3 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge tone={isDirty ? "warning" : "info"} label={isDirty ? "Unsaved changes" : "Draft"} />
        <span className="font-mono text-xs text-muted-foreground">{draftId}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatSavedAgo(lastSavedAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onExit}>
          <X className="h-4 w-4" /> Exit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSaveDraft}>
          <Save className="h-4 w-4" /> Save draft
        </Button>
      </div>
    </div>
  );
}
