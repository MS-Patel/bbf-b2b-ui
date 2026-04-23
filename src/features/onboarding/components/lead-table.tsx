import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { ONBOARDING_OWNERS } from "@/features/onboarding/api";
import { STAGE_LABELS, type LeadStage, type OnboardingLead, type OwnerRole } from "@/features/onboarding/types";
import { formatDate } from "@/lib/format";

const STAGE_TONE: Record<LeadStage, StatusTone> = {
  lead: "muted",
  kyc_started: "info",
  kyc_in_review: "warning",
  verified: "success",
  first_invest: "info",
};

interface Props {
  leads: OnboardingLead[];
  onSelect: (lead: OnboardingLead) => void;
  showOwnerFilter?: boolean;
}

export function LeadTable({ leads, onSelect, showOwnerFilter = false }: Props) {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const [ownerRole, setOwnerRole] = useState<OwnerRole | "all">("all");
  const [ownerId, setOwnerId] = useState<string>("all");

  const rows = useMemo(() => leads.filter((l) => {
    if (stage !== "all" && l.stage !== stage) return false;
    if (ownerRole !== "all" && l.ownerRole !== ownerRole) return false;
    if (ownerId !== "all" && l.ownerId !== ownerId) return false;
    if (search && !`${l.fullName} ${l.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [leads, search, stage, ownerRole, ownerId]);

  const columns: DataTableColumn<OnboardingLead>[] = [
    {
      id: "name", header: "Lead", sortValue: (r) => r.fullName,
      accessor: (r) => (
        <div>
          <p className="font-semibold">{r.fullName}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { id: "stage", header: "Stage", sortValue: (r) => r.stage, accessor: (r) => <StatusBadge tone={STAGE_TONE[r.stage]} label={STAGE_LABELS[r.stage]} /> },
    { id: "source", header: "Source", sortValue: (r) => r.source, accessor: (r) => <span className="text-sm">{r.source}</span> },
    ...(showOwnerFilter
      ? [{
          id: "owner", header: "Owner", sortValue: (r: OnboardingLead) => r.ownerName,
          accessor: (r: OnboardingLead) => (
            <div>
              <p className="text-sm font-medium">{r.ownerName}</p>
              <p className="text-xs text-muted-foreground capitalize">{r.ownerRole}</p>
            </div>
          ),
        }]
      : []),
    { id: "updated", header: "Updated", sortValue: (r) => r.updatedAt, accessor: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.updatedAt)}</span> },
    {
      id: "actions", header: "", align: "right",
      accessor: (r) => <Button size="sm" variant="outline" onClick={() => onSelect(r)}>View</Button>,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…" className="pl-9" />
          </div>
          <Select value={stage} onValueChange={(v) => setStage(v as LeadStage | "all")}>
            <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {(Object.keys(STAGE_LABELS) as LeadStage[]).map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showOwnerFilter && (
            <>
              <Select value={ownerRole} onValueChange={(v) => { setOwnerRole(v as OwnerRole | "all"); setOwnerId("all"); }}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Owner role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="rm">RM</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Owner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {ONBOARDING_OWNERS.filter((o) => ownerRole === "all" || o.role === ownerRole).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={rows}
        initialSortId="updated"
        initialSortDir="desc"
        pageSize={10}
        mobileCard={(r) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{r.email}</p>
              </div>
              <StatusBadge tone={STAGE_TONE[r.stage]} label={STAGE_LABELS[r.stage]} />
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => onSelect(r)}>View details</Button>
          </div>
        )}
      />
    </div>
  );
}
