import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderConfirmation } from "@/types/orders";
import { formatDate, formatINR } from "@/lib/format";

interface OrderSuccessProps {
  confirmation: OrderConfirmation;
  onPlaceAnother: () => void;
}

const COPY = {
  lumpsum: {
    title: "Order placed successfully",
    body: "Your purchase order has been accepted by BSE Star MF. Units will be allotted at the next applicable NAV.",
    action: "Place another order",
  },
  sip: {
    title: "SIP registered successfully",
    body: "Your NACH mandate is being set up with your bank. The first installment will debit on the start date.",
    action: "Start another SIP",
  },
  redeem: {
    title: "Redemption submitted",
    body: "Your redemption order is on its way to BSE Star MF. Proceeds will be credited to your bank account.",
    action: "Redeem another holding",
  },
  switch: {
    title: "Switch submitted",
    body: "Your switch order has been accepted. Units will be redeemed and reallocated at the next applicable NAV.",
    action: "Switch another holding",
  },
} as const;

export function OrderSuccess({ confirmation, onPlaceAnother }: OrderSuccessProps) {
  const copy = COPY[confirmation.orderType];

  return (
    <Card className="overflow-hidden shadow-elegant">
      <CardContent className="space-y-6 p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-accent shadow-glow">
          <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">{copy.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        </div>

        <dl className="mx-auto grid max-w-md grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/40 p-5 text-left">
          <Row label="Order ID" value={confirmation.orderId} />
          <Row label="BSE Reference" value={confirmation.bseOrderRef} />

          {confirmation.orderType === "sip" ? (
            <>
              <Row label="Monthly amount" value={formatINR(confirmation.primaryAmount)} />
              <Row
                label="First debit"
                value={confirmation.firstDebitDate ? formatDate(confirmation.firstDebitDate) : "—"}
              />
              {confirmation.mandateRef && (
                <div className="col-span-2 border-t border-border pt-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    NACH mandate
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold">{confirmation.mandateRef}</dd>
                </div>
              )}
            </>
          ) : confirmation.orderType === "redeem" ? (
            <>
              <Row label="Estimated proceeds" value={formatINR(confirmation.estimatedProceeds ?? confirmation.primaryAmount)} />
              <Row label="Units redeemed" value={confirmation.units?.toString() ?? "—"} />
              <Row
                label="NAV applicable"
                value={formatDate(confirmation.estimatedNavDate)}
              />
              <Row
                label="Credit ETA"
                value={confirmation.creditEtaDate ? formatDate(confirmation.creditEtaDate) : "—"}
              />
            </>
          ) : confirmation.orderType === "switch" ? (
            <>
              <Row label="Switch amount" value={formatINR(confirmation.primaryAmount)} />
              <Row label="Units" value={confirmation.units?.toString() ?? "—"} />
              <Row label="NAV applicable" value={formatDate(confirmation.estimatedNavDate)} />
            </>
          ) : (
            <>
              <Row label="Amount" value={formatINR(confirmation.primaryAmount)} />
              <Row label="NAV applicable" value={formatDate(confirmation.estimatedNavDate)} />
            </>
          )}

          <div className="col-span-2 border-t border-border pt-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {confirmation.orderType === "switch" ? "From scheme" : "Scheme"}
            </dt>
            <dd className="mt-1 text-sm font-semibold">{confirmation.schemeName}</dd>
            {confirmation.toSchemeName && (
              <>
                <dt className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  To scheme
                </dt>
                <dd className="mt-1 text-sm font-semibold">{confirmation.toSchemeName}</dd>
              </>
            )}
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={onPlaceAnother}>
            {copy.action}
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
