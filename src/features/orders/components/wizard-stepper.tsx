import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface WizardStepperProps {
  steps: Step[];
  current: number; // 0-indexed
}

export function WizardStepper({ steps, current }: WizardStepperProps) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 transition-colors",
                done && "bg-success text-success-foreground ring-success",
                active && "bg-primary text-primary-foreground ring-primary shadow-glow",
                !done && !active && "bg-secondary text-muted-foreground ring-border",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p
                className={cn(
                  "truncate text-xs font-semibold uppercase tracking-wider",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                Step {i + 1}
              </p>
              <p className={cn("truncate text-sm", active ? "font-semibold" : "text-muted-foreground")}>
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  done ? "bg-success/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
