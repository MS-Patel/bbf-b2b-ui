import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkflowActionBarProps {
  isFirst: boolean;
  isLast: boolean;
  canContinue: boolean;
  canSubmit: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  helperText?: string;
}

export function WorkflowActionBar({ isFirst, isLast, canContinue, canSubmit, isSubmitting, onBack, onContinue, onSaveDraft, onSubmit, helperText }: WorkflowActionBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack} disabled={isFirst}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onSaveDraft}>
          <Save className="h-4 w-4" /> Save draft
        </Button>
        {isLast ? (
          <Button type="button" size="sm" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
            <Send className="h-4 w-4" /> {isSubmitting ? "Submitting…" : "Submit onboarding"}
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={onContinue} disabled={!canContinue}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
