import { Ban, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { useCancelOrderMutation, useRetryOrderMutation } from "@/features/orders/api";
import { ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, type Order, type OrderStatus, type OrderType } from "@/types/orders";
import { formatDate, formatINR } from "@/lib/format";

const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  draft: "muted",
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "destructive",
  cancelled: "muted",
};

const TYPE_TONE: Record<OrderType, StatusTone> = {
  lump_sum: "info",
  sip: "success",
  switch: "warning",
  redeem: "destructive",
};

interface Props {
  orders: Order[];
  showPlacedBy?: boolean;
}

export function OrdersTable({ orders, showPlacedBy = false }: Props) {
  const cancel = useCancelOrderMutation();
  const retry = useRetryOrderMutation();

  const columns: DataTableColumn<Order>[] = [
    {
      id: "client",
      header: "Client",
      sortValue: (r) => r.clientName,
      accessor: (r) => (
        <div>
          <p className="font-medium">{r.clientName}</p>
          <p className="text-xs text-muted-foreground">{r.id}</p>
        </div>
      ),
    },
    {
      id: "scheme",
      header: "Scheme",
      accessor: (r) => (
        <div className="max-w-[260px]">
          <p className="truncate text-sm font-medium">{r.schemeName}</p>
          <p className="text-xs text-muted-foreground">{r.amc}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      sortValue: (r) => r.type,
      accessor: (r) => <StatusBadge tone={TYPE_TONE[r.type]} label={ORDER_TYPE_LABEL[r.type]} dot={false} />,
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => r.amount ?? 0,
      accessor: (r) => (r.amount ? <span className="font-semibold">{formatINR(r.amount)}</span> : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "units",
      header: "Units",
      align: "right",
      sortValue: (r) => r.units ?? 0,
      accessor: (r) => (r.units ? <span className="tabular-nums">{r.units.toFixed(3)}</span> : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={ORDER_STATUS_LABEL[r.status]} />,
    },
    ...(showPlacedBy
      ? [
          {
            id: "placedBy",
            header: "Placed by",
            sortValue: (r: Order) => r.placedByName,
            accessor: (r: Order) => (
              <div className="text-xs">
                <p className="font-medium">{r.placedByName}</p>
                <p className="capitalize text-muted-foreground">{r.placedByRole}</p>
              </div>
            ),
          } as DataTableColumn<Order>,
        ]
      : []),
    {
      id: "placedAt",
      header: "Placed",
      sortValue: (r) => r.placedAt,
      accessor: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.placedAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      align: "right",
      accessor: (r) => {
        if (r.status === "pending") {
          return (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => {
                cancel.mutate(r.id, { onSuccess: () => toast.success("Order cancelled") });
              }}
            >
              <Ban className="h-3.5 w-3.5" /> Cancel
            </Button>
          );
        }
        if (r.status === "failed") {
          return (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                retry.mutate(r.id, { onSuccess: () => toast.success("Order resubmitted") });
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      pageSize={12}
      initialSortId="placedAt"
      initialSortDir="desc"
      mobileCard={(r) => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.clientName}</p>
              <p className="truncate text-xs text-muted-foreground">{r.schemeName}</p>
            </div>
            <StatusBadge tone={STATUS_TONE[r.status]} label={ORDER_STATUS_LABEL[r.status]} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <StatusBadge tone={TYPE_TONE[r.type]} label={ORDER_TYPE_LABEL[r.type]} dot={false} />
            {r.amount && <span className="font-semibold tabular-nums">{formatINR(r.amount)}</span>}
          </div>
        </div>
      )}
    />
  );
}
