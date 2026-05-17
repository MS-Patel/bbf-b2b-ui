import type { ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "error" | "pending";

export interface StepDefinition {
  id: string;
  label: string;
  description?: string;
  status?: StepStatus;
}

export interface StepFormProps {
  steps: StepDefinition[];
  currentStepId: string;
  onStepChange?: (id: string) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  nextLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  children: ReactNode;
  className?: string;
}

export function StepForm({
  steps,
  currentStepId,
  onStepChange,
  onBack,
  onNext,
  onSaveDraft,
  onSubmit,
  nextLabel = "Continue",
  submitLabel = "Submit",
  isSubmitting,
  children,
  className,
}: StepFormProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[260px_1fr]", className)}>
      <aside className="rounded-xl border border-border bg-card p-3">
        <ol className="space-y-1">
          {steps.map((step, idx) => {
            const status: StepStatus =
              step.status ?? (idx < currentIndex ? "complete" : idx === currentIndex ? "current" : "pending");
            const active = step.id === currentStepId;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepChange?.(step.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    active ? "bg-secondary/70" : "hover:bg-secondary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset",
                      status === "complete" && "bg-success/15 text-success ring-success/30",
                      status === "current" && "bg-primary text-primary-foreground ring-primary",
                      status === "error" && "bg-destructive/15 text-destructive ring-destructive/30",
                      status === "pending" && "bg-muted text-muted-foreground ring-border",
                    )}
                  >
                    {status === "complete" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : status === "error" ? (
                      <CircleAlert className="h-3.5 w-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{step.label}</span>
                    {step.description && (
                      <span className="block truncate text-xs text-muted-foreground">{step.description}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isFirst}>
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {onSaveDraft && (
              <Button type="button" variant="ghost" onClick={onSaveDraft}>
                Save draft
              </Button>
            )}
            {isLast ? (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                {submitLabel}
              </Button>
            ) : (
              <Button type="button" onClick={onNext}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
