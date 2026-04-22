import { Link } from "@tanstack/react-router";
import { Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Scheme } from "@/types/scheme";
import { formatCompactINR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RISK_LABEL: Record<Scheme["risk"], string> = {
  low: "Low",
  moderate: "Moderate",
  moderately_high: "Mod-High",
  high: "High",
  very_high: "Very High",
};

const RISK_TONE: Record<Scheme["risk"], string> = {
  low: "bg-success/12 text-success",
  moderate: "bg-info/12 text-info",
  moderately_high: "bg-warning/15 text-warning dark:text-warning",
  high: "bg-warning/20 text-warning dark:text-warning",
  very_high: "bg-destructive/12 text-destructive",
};

interface SchemeCardProps {
  scheme: Scheme;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  return (
    <Card className="group overflow-hidden shadow-card transition-shadow hover:shadow-elegant">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {scheme.amc} · {scheme.category}
            </p>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{scheme.schemeName}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {scheme.rating}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/40 p-3">
          <Stat label="1Y" value={formatPercent(scheme.return1y, 1)} positive />
          <Stat label="3Y" value={formatPercent(scheme.return3y, 1)} positive />
          <Stat label="5Y" value={scheme.return5y > 0 ? formatPercent(scheme.return5y, 1) : "—"} positive={scheme.return5y > 0} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-medium">NAV ₹{scheme.nav.toFixed(2)}</span>
          <span>AUM {formatCompactINR(scheme.aumCr * 1e7)}</span>
          <Badge variant="secondary" className={cn("border-0 font-medium", RISK_TONE[scheme.risk])}>
            {RISK_LABEL[scheme.risk]}
          </Badge>
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/app/investor/explore/$schemeId" params={{ schemeId: scheme.id }}>
              View
            </Link>
          </Button>
          <Button asChild className="flex-1 gap-1.5">
            <Link to="/app/investor/orders/lumpsum" search={{ schemeId: scheme.id }}>
              <TrendingUp className="h-3.5 w-3.5" />
              Invest
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", positive ? "text-profit" : "text-foreground")}>{value}</p>
    </div>
  );
}
