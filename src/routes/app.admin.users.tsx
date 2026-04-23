import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MoreHorizontal, UserCheck, Ban, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { usePlatformUsersQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME, ROLE_LABEL } from "@/features/auth/role-routes";
import { formatCompactINR, formatDate } from "@/lib/format";
import type { PlatformUser, KycStatusLite, PlatformUserStatus } from "@/types/admin";
import type { UserRole } from "@/types/auth";

export const Route = createFileRoute("/app/admin/users")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Users & roles — Admin" }] }),
  component: AdminUsersPage,
});

const KYC_TONE: Record<KycStatusLite, StatusTone> = {
  verified: "success",
  pending: "warning",
  rejected: "destructive",
  not_started: "muted",
};
const STATUS_TONE: Record<PlatformUserStatus, StatusTone> = {
  active: "success",
  suspended: "destructive",
  invited: "info",
};

function AdminUsersPage() {
  const { data, isLoading } = usePlatformUsersQuery();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [kyc, setKyc] = useState<KycStatusLite | "all">("all");

  const rows = (data ?? []).filter((u) => {
    if (role !== "all" && u.role !== role) return false;
    if (kyc !== "all" && u.kycStatus !== kyc) return false;
    if (search && !`${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: DataTableColumn<PlatformUser>[] = [
    {
      id: "name",
      header: "User",
      sortValue: (r) => r.fullName,
      accessor: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{r.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortValue: (r) => r.role,
      accessor: (r) => <span className="text-sm">{ROLE_LABEL[r.role]}</span>,
    },
    {
      id: "kyc",
      header: "KYC",
      sortValue: (r) => r.kycStatus,
      accessor: (r) => <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} />,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />,
    },
    {
      id: "aum",
      header: "AUM",
      align: "right",
      sortValue: (r) => r.aum ?? -1,
      accessor: (r) => (r.aum ? formatCompactINR(r.aum) : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "joined",
      header: "Joined",
      sortValue: (r) => r.joinedAt,
      accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.joinedAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      align: "right",
      accessor: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast(`Opened ${r.fullName}`)}>
              <Eye className="mr-2 h-4 w-4" /> View profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success(`KYC reviewed for ${r.fullName}`)}>
              <UserCheck className="mr-2 h-4 w-4" /> Review KYC
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => toast.error(`Suspended ${r.fullName}`)}
            >
              <Ban className="mr-2 h-4 w-4" /> Suspend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin · Users"
        title="Users & roles"
        description={`${data?.length ?? 0} platform accounts across admins, RMs, and distributors.`}
      />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="rm">RM</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kyc} onValueChange={(v) => setKyc(v as KycStatusLite | "all")}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="KYC" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="shadow-card"><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading users…</CardContent></Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            initialSortId="joined"
            initialSortDir="desc"
            pageSize={12}
            mobileCard={(r) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[r.status]} label={r.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ROLE_LABEL[r.role]}</span>
                  <StatusBadge tone={KYC_TONE[r.kycStatus]} label={r.kycStatus.replace("_", " ")} />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
