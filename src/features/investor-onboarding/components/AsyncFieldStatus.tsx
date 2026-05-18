import { AlertCircle, CheckCircle2, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AsyncStatus = "idle" | "checking" | "verified" | "invalid" | "duplicate" | "found";

const CONFIG: Record<AsyncStatus, { label: string; icon: LucideIcon | null; cls: string }> = {
  idle: { label: "", icon: null, cls: "" },
  checking: { label: "Verifying…", icon: Loader2, cls: "text-info" },
  verified: { label: "Verified", icon: CheckCircle2, cls: "text-success" },
  found: { label: "Found", icon: CheckCircle2, cls: "text-success" },
  invalid: { label: "Invalid", icon: AlertCircle, cls: "text-destructive" },
  duplicate: { label: "Duplicate found", icon: AlertCircle, cls: "text-warning" },
};

export function AsyncFieldStatus({ status, label, className }: { status: AsyncStatus; label?: string; className?: string }) {
  const cfg = CONFIG[status];
  if (status === "idle" || !cfg.icon) return null;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.cls, className)}>
      <Icon className={cn("h-3.5 w-3.5", status === "checking" && "animate-spin")} />
      {label ?? cfg.label}
    </span>
  );
}
