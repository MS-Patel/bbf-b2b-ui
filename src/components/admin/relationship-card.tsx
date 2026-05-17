import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface RelationshipCardProps {
  name: string;
  role?: string;
  relation?: string;
  meta?: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  avatarFallback?: string;
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RelationshipCard({
  name,
  role,
  relation,
  meta = [],
  actions,
  avatarFallback,
  className,
}: RelationshipCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {avatarFallback ?? initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            {role && <p className="truncate text-xs text-muted-foreground">{role}</p>}
          </div>
          {relation && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {relation}
            </Badge>
          )}
        </div>
        {meta.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
            {meta.map((m) => (
              <div key={m.label} className="min-w-0">
                <dt className="text-muted-foreground">{m.label}</dt>
                <dd className="truncate font-medium">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
      </CardContent>
    </Card>
  );
}
