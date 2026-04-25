import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import type { Order } from "@/types/orders";
import { CheckCircle2, Clock, TrendingUp, XCircle } from "lucide-react";

interface Props {
  orders: Order[];
}

export function OrderStats({ orders }: Props) {
  const today = new Date().toDateString();
  const todays = orders.filter((o) => new Date(o.placedAt).toDateString() === today);
  const grossToday = todays
    .filter((o) => o.type === "lump_sum" && (o.status === "completed" || o.status === "processing" || o.status === "pending"))
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const sipsToday = todays.filter((o) => o.type === "sip").length;
  const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const failed = orders.filter((o) => o.status === "failed").length;

  const items = [
    { label: "Gross investment today", value: formatINR(grossToday), Icon: TrendingUp, tone: "text-success" },
    { label: "SIPs registered today", value: sipsToday.toString(), Icon: CheckCircle2, tone: "text-info" },
    { label: "Pending verification", value: pending.toString(), Icon: Clock, tone: "text-warning" },
    { label: "Failed", value: failed.toString(), Icon: XCircle, tone: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{it.label}</p>
              <it.Icon className={`h-4 w-4 ${it.tone}`} />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{it.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
