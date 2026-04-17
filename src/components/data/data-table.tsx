import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  headClassName?: string;
}

interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  initialSortId?: string;
  initialSortDir?: "asc" | "desc";
  mobileCard?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  initialSortId,
  initialSortDir = "desc",
  mobileCard,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [sortId, setSortId] = useState<string | undefined>(initialSortId);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);

  const sorted = useMemo(() => {
    if (!sortId) return data;
    const col = columns.find((c) => c.id === sortId);
    if (!col?.sortValue) return data;
    const sortFn = col.sortValue;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = sortFn(a);
      const bv = sortFn(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortId, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(id: string) {
    if (sortId === id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortId(id);
      setSortDir("desc");
    }
    setPage(0);
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
        {emptyState ?? <p className="text-sm text-muted-foreground">No records to display.</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const active = sortId === col.id;
                return (
                  <TableHead
                    key={col.id}
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.headClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
                          col.align === "right" && "ml-auto",
                          active && "text-foreground",
                        )}
                      >
                        {col.header}
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((row) => (
              <TableRow key={row.id} className="border-border/60">
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      "py-3 text-sm",
                      col.align === "right" && "text-right tabular-nums",
                      col.align === "center" && "text-center",
                      col.className,
                    )}
                  >
                    {col.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      {mobileCard && (
        <div className="space-y-3 md:hidden">
          {slice.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{safePage * pageSize + 1}</span>–
            <span className="font-semibold text-foreground">
              {Math.min((safePage + 1) * pageSize, sorted.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{sorted.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
