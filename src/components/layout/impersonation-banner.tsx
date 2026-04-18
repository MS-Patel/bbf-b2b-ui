import { useNavigate } from "@tanstack/react-router";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImpersonationStore } from "@/features/impersonation/store";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export function ImpersonationBanner() {
  const client = useImpersonationStore((s) => s.client);
  const stop = useImpersonationStore((s) => s.stop);
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();

  if (!client) return null;

  const exitTo = role && role !== "investor" ? ROLE_HOME[role] : "/app/investor";

  return (
    <div className="sticky top-0 z-40 border-b border-warning/30 bg-warning/10 backdrop-blur supports-[backdrop-filter]:bg-warning/10">
      <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-warning/20 text-warning">
            <Eye className="h-4 w-4" />
          </span>
          <p className="truncate text-sm">
            <span className="text-muted-foreground">Viewing as</span>{" "}
            <span className="font-semibold">{client.fullName}</span>
            <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
              · {client.email} · Read-only
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-warning/40 bg-background/60 hover:bg-background"
          onClick={() => {
            stop();
            void navigate({ to: exitTo });
          }}
        >
          <X className="h-3.5 w-3.5" />
          Exit
        </Button>
      </div>
    </div>
  );
}
