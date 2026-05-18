import { Check, AlertCircle, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StepDefinitionUI, StepKey, StepProgress, StepValidity } from "../types";

export interface WorkflowStepperProps {
  steps: StepDefinitionUI[];
  currentStep: StepKey;
  progress: Record<StepKey, StepProgress>;
  onStepClick: (key: StepKey) => void;
  overallPct: number;
}

function bubbleClasses(status: StepValidity): string {
  switch (status) {
    case "complete":
      return "bg-success/15 text-success ring-success/30";
    case "current":
      return "bg-primary text-primary-foreground ring-primary";
    case "error":
      return "bg-destructive/15 text-destructive ring-destructive/30";
    case "locked":
      return "bg-muted text-muted-foreground/60 ring-border";
    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

export function WorkflowStepper({ steps, currentStep, progress, onStepClick, overallPct }: WorkflowStepperProps) {
  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-3">
      <div className="px-2 pt-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold tabular-nums">{overallPct}%</span>
        </div>
        <Progress value={overallPct} className="mt-2 h-1.5" />
      </div>

      <ol className="space-y-1">
        {steps.map((step) => {
          const p = progress[step.key];
          const active = step.key === currentStep;
          const status: StepValidity = active ? "current" : p.status;
          const disabled = status === "locked";
          return (
            <li key={step.key}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onStepClick(step.key)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-secondary/70" : "hover:bg-secondary/40",
                  disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
                )}
              >
                <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset", bubbleClasses(status))}>
                  {status === "complete" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : status === "locked" ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    step.index
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium leading-tight">{step.label}</span>
                    {p.errorCount > 0 && status !== "current" && (
                      <span className="rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold text-destructive">
                        {p.errorCount}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
