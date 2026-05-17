import { Timeline, type TimelineTone } from "./timeline";
import { cn } from "@/lib/utils";

export interface AuditEntry {
  id: string;
  actor: string;
  actorRole?: string;
  action: string;
  target?: string;
  at: string;
  tone?: TimelineTone;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
}

function DiffRow({ k, before, after }: { k: string; before: unknown; after: unknown }) {
  return (
    <div className="grid grid-cols-[120px_1fr_1fr] gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs">
      <span className="font-medium text-muted-foreground">{k}</span>
      <span className="truncate text-destructive line-through">{String(before ?? "—")}</span>
      <span className="truncate text-success">{String(after ?? "—")}</span>
    </div>
  );
}

export interface AuditTrailProps {
  entries: AuditEntry[];
  className?: string;
}

export function AuditTrail({ entries, className }: AuditTrailProps) {
  const items = entries.map((entry) => {
    const keys = new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})]);
    return {
      id: entry.id,
      tone: entry.tone ?? "info",
      title: (
        <span>
          <span className="font-semibold">{entry.actor}</span>
          {entry.actorRole && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({entry.actorRole})</span>}{" "}
          <span className="font-normal text-muted-foreground">{entry.action}</span>
          {entry.target && <span className="ml-1 font-medium">{entry.target}</span>}
        </span>
      ),
      meta: entry.at,
      body:
        keys.size === 0 && !entry.note ? null : (
          <div className="space-y-1.5">
            {entry.note && <p>{entry.note}</p>}
            {keys.size > 0 && (
              <div className="space-y-1">
                {Array.from(keys).map((k) => (
                  <DiffRow
                    key={k}
                    k={k}
                    before={entry.before?.[k]}
                    after={entry.after?.[k]}
                  />
                ))}
              </div>
            )}
          </div>
        ),
    };
  });
  return <Timeline items={items} className={cn(className)} />;
}
