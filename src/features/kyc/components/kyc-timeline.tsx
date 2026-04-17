import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import type { KycStep } from "@/types/kyc";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface KycTimelineProps {
  steps: KycStep[];
}

export function KycTimeline({ steps }: KycTimelineProps) {
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {steps.map((step) => {
        const Icon =
          step.status === "completed"
            ? CheckCircle2
            : step.status === "in_progress"
              ? Clock
              : step.status === "failed"
                ? XCircle
                : Circle;
        const tone =
          step.status === "completed"
            ? "text-success bg-success/15"
            : step.status === "in_progress"
              ? "text-warning bg-warning/15"
              : step.status === "failed"
                ? "text-destructive bg-destructive/15"
                : "text-muted-foreground bg-muted";
        return (
          <li key={step.id} className="relative">
            <span
              className={cn(
                "absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full ring-4 ring-background",
                tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <p className="text-sm font-semibold">{step.label}</p>
                {step.completedAt && (
                  <span className="text-xs text-muted-foreground">{formatDate(step.completedAt)}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
