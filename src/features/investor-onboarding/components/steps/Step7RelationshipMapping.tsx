import { Building2, Briefcase, GitBranch, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { MOCK_BRANCHES, MOCK_DISTRIBUTORS, MOCK_FRANCHISES, MOCK_RMS } from "../../fixtures";
import type { RelationshipData } from "../../types";

export interface Step7Props {
  value: RelationshipData;
  onChange: (next: RelationshipData) => void;
}

export function Step7RelationshipMapping({ value, onChange }: Step7Props) {
  const rm = MOCK_RMS.find((r) => r.id === value.rmId);
  const distributor = MOCK_DISTRIBUTORS.find((d) => d.id === value.distributorId);
  const branch = MOCK_BRANCHES.find((b) => b.id === (rm?.branchId ?? value.branchId));
  const franchise = MOCK_FRANCHISES.find((f) => f.id === (distributor?.franchiseId ?? branch?.franchiseId));

  const set = <K extends keyof RelationshipData>(k: K, v: RelationshipData[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <SectionCard title="Assign relationship manager & distributor" description="Drives commissions, attribution, and servicing.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Relationship Manager</Label>
              <Select value={value.rmId ?? ""} onValueChange={(v) => {
                const r = MOCK_RMS.find((x) => x.id === v);
                onChange({ ...value, rmId: v, branchId: r?.branchId ?? value.branchId });
              }}>
                <SelectTrigger><SelectValue placeholder="Select RM" /></SelectTrigger>
                <SelectContent>{MOCK_RMS.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Distributor</Label>
              <Select value={value.distributorId ?? ""} onValueChange={(v) => set("distributorId", v)}>
                <SelectTrigger><SelectValue placeholder="Select distributor" /></SelectTrigger>
                <SelectContent>{MOCK_DISTRIBUTORS.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name} <span className="text-muted-foreground">· {d.code}</span></SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>EUIN (optional)</Label>
              <Input value={value.euin ?? ""} onChange={(e) => set("euin", e.target.value.toUpperCase())} className="font-mono uppercase" placeholder="E123456" />
            </div>
            <div className="space-y-1.5">
              <Label>Sub-broker code (optional)</Label>
              <Input value={value.subBrokerCode ?? ""} onChange={(e) => set("subBrokerCode", e.target.value)} />
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <ContextCard icon={<Building2 className="h-4 w-4" />} label="Branch" name={branch?.name} sub={branch ? `Region · ${branch.region}` : "Auto-derived from RM"} />
          <ContextCard icon={<Briefcase className="h-4 w-4" />} label="Franchise" name={franchise?.name} sub="Auto-derived from distributor / branch" />
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" /> Servicing hierarchy
        </div>
        <ol className="mt-4 space-y-3">
          <HierarchyRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Franchise" value={franchise?.name} />
          <HierarchyRow icon={<Building2 className="h-3.5 w-3.5" />} label="Branch" value={branch?.name} />
          <HierarchyRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Distributor" value={distributor ? `${distributor.name} · ${distributor.code}` : undefined} />
          <HierarchyRow icon={<User className="h-3.5 w-3.5" />} label="RM" value={rm?.name} />
          <HierarchyRow icon={<User className="h-3.5 w-3.5" />} label="Investor" value="New onboarding draft" highlight />
        </ol>
      </aside>
    </div>
  );
}

function ContextCard({ icon, label, name, sub }: { icon: React.ReactNode; label: string; name?: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 text-sm font-semibold">{name ?? <span className="text-muted-foreground">Not selected</span>}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function HierarchyRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value?: string; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${highlight ? "bg-primary text-primary-foreground ring-primary" : "bg-muted text-muted-foreground ring-border"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value ?? "—"}</p>
      </div>
    </li>
  );
}
