import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderConfirmation } from "@/types/orders";
import { formatINR, formatDate } from "@/lib/format";

interface OrderSuccessProps {
  confirmation: OrderConfirmation;
  onPlaceAnother: () => void;
}

export function OrderSuccess({ confirmation, onPlaceAnother }: OrderSuccessProps) {
  return (
    <Card className="overflow-hidden shadow-elegant">
      <CardContent className="space-y-6 p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-accent shadow-glow">
          <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Order placed successfully</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your purchase order has been accepted by BSE Star MF. Units will be allotted at the next applicable NAV.
          </p>
        </div>

        <dl className="mx-auto grid max-w-md grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/40 p-5 text-left">
          <Row label="Order ID" value={confirmation.orderId} />
          <Row label="BSE Reference" value={confirmation.bseOrderRef} />
          <Row label="Amount" value={formatINR(confirmation.amount)} />
          <Row label="NAV applicable" value={formatDate(confirmation.estimatedNavDate)} />
          <div className="col-span-2 border-t border-border pt-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scheme</dt>
            <dd className="mt-1 text-sm font-semibold">{confirmation.schemeName}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={onPlaceAnother}>
            Place another order
          </Button>
          <Button asChild className="gap-1.5">
            <Link to="/app/investor/transactions">
              View transactions <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
