import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileClock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ORDER_TYPE_LABEL } from "@/types/orders";
import { listDrafts, deleteDraft, type OrderDraft } from "@/features/orders/drafts";
import { formatINR } from "@/lib/format";

interface Props {
  ownerId: string;
  newOrderTo: "/app/admin/orders/new" | "/app/rm/orders/new" | "/app/distributor/orders/new";
}

export function DraftsCard({ ownerId, newOrderTo }: Props) {
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);

  useEffect(() => {
    const load = () => setDrafts(listDrafts(ownerId));
    load();
    const handler = () => load();
    window.addEventListener("orders:drafts-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("orders:drafts-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, [ownerId]);

  if (drafts.length === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning/5 shadow-card">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold">Resume drafts ({drafts.length})</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.slice(0, 6).map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge tone="warning" label={ORDER_TYPE_LABEL[d.type]} dot={false} />
                  <span className="truncate text-xs text-muted-foreground">Step {d.step}/3</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">
                  {d.clientName ?? "No client yet"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.schemeName ?? "No scheme yet"}
                  {d.amount ? ` · ${formatINR(d.amount)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link to={newOrderTo} search={{ draftId: d.id }}>
                    Resume
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => deleteDraft(d.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
