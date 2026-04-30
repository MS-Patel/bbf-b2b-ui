import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStats } from "@/features/orders/components/order-stats";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { useOrdersQuery } from "@/features/orders/api";
import type { OrderStatus, OrderType, PlacedByRole } from "@/types/orders";

interface Props {
  scope: "all" | "rm" | "distributor";
  placedBy: { id: string; name: string; role: PlacedByRole };
  eyebrow: string;
  description: string;
  showPlacedBy?: boolean;
  preselectedClientId?: string;
}

const NEW_ORDER_ROUTE: Record<Props["scope"], "/app/admin/orders/new" | "/app/rm/orders/new" | "/app/distributor/orders/new"> = {
  all: "/app/admin/orders/new",
  rm: "/app/rm/orders/new",
  distributor: "/app/distributor/orders/new",
};

export function OrdersRegister({ scope, placedBy, eyebrow, description, showPlacedBy, preselectedClientId }: Props) {
  const { data, isLoading } = useOrdersQuery({ scope, ownerId: scope === "all" ? undefined : placedBy.id });
  const orders = data ?? [];
  const [search, setSearch] = useState("");
  const [type, setType] = useState<OrderType | "all">("all");
  const [status, setStatus] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (type !== "all" && o.type !== type) return false;
        if (status !== "all" && o.status !== status) return false;
        if (search && !`${o.clientName} ${o.schemeName} ${o.amc} ${o.id}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [orders, type, status, search],
  );

  const newOrderTo = NEW_ORDER_ROUTE[scope];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Orders register"
        description={description}
        actions={
          <Button asChild className="gap-1.5">
            <Link
              to={newOrderTo}
              search={{ clientId: preselectedClientId }}
            >
              <ShoppingCart className="h-4 w-4" /> New order
            </Link>
          </Button>
        }
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <OrderStats orders={orders} />
        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client, scheme or order ID…" className="pl-9" />
            </div>
            <Select value={type} onValueChange={(v) => setType(v as OrderType | "all")}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="lump_sum">Lump-sum</SelectItem>
                <SelectItem value="sip">SIP</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
                <SelectItem value="redeem">Redeem</SelectItem>
                <SelectItem value="stp">STP</SelectItem>
                <SelectItem value="swp">SWP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading orders…</CardContent></Card>
        ) : (
          <OrdersTable orders={filtered} showPlacedBy={showPlacedBy} />
        )}
      </div>
    </>
  );
}
