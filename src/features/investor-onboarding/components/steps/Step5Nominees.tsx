import { Plus, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { AllocationMeter } from "../AllocationMeter";
import { ValidationBanner } from "../ValidationBanner";
import { RELATION_OPTIONS } from "../../constants";
import type { Nominee } from "../../types";

export interface Step5Props {
  value: Nominee[];
  onChange: (next: Nominee[]) => void;
}

function emptyNominee(): Nominee {
  return { id: `nm_${Date.now()}`, fullName: "", relation: "Spouse", sharePct: 0, isMinor: false };
}

export function Step5Nominees({ value, onChange }: Step5Props) {
  const total = value.reduce((s, n) => s + (Number(n.sharePct) || 0), 0);
  const issues: string[] = [];
  if (value.length > 0 && total !== 100) issues.push(`Allocation total is ${total}% — must equal 100%`);
  value.forEach((n, i) => {
    if (n.isMinor && !n.guardian?.fullName) issues.push(`Nominee ${i + 1} is a minor — guardian details required`);
  });

  const update = (id: string, patch: Partial<Nominee>) => onChange(value.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const add = () => value.length < 3 && onChange([...value, emptyNominee()]);
  const remove = (id: string) => onChange(value.filter((n) => n.id !== id));

  return (
    <div className="space-y-5">
      {issues.length > 0 ? (
        <ValidationBanner tone="error" title="Resolve nominee issues" items={issues} />
      ) : value.length === 0 ? (
        <ValidationBanner
          tone="warning"
          title="No nominees declared"
          description="You may opt-out of nomination, but a signed declaration is required at submission."
        />
      ) : null}

      <SectionCard
        title="Nominees"
        description="Up to 3 nominees. Allocation must total 100%."
        aside={<Button type="button" size="sm" variant="outline" onClick={add} disabled={value.length >= 3}><Plus className="h-4 w-4" /> Add nominee</Button>}
      >
        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/40 px-6 py-10 text-center">
            <UserMinus className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No nominees added</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={add}>
              <Plus className="h-4 w-4" /> Add nominee
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {value.map((n, idx) => (
              <div key={n.id} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nominee {idx + 1}</p>
                  <Button type="button" size="icon" variant="ghost" onClick={() => remove(n.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_120px]">
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input value={n.fullName} onChange={(e) => update(n.id, { fullName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relation</Label>
                    <Select value={n.relation} onValueChange={(v) => update(n.id, { relation: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RELATION_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of birth</Label>
                    <Input type="date" value={n.dateOfBirth ?? ""} onChange={(e) => update(n.id, { dateOfBirth: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Allocation %</Label>
                    <Input type="number" min={0} max={100} value={n.sharePct} onChange={(e) => update(n.id, { sharePct: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className="tabular-nums" />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={n.isMinor} onChange={(e) => update(n.id, { isMinor: e.target.checked })} />
                  Nominee is a minor
                </label>
                {n.isMinor && (
                  <div className="mt-3 grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase text-muted-foreground">Guardian name</Label>
                      <Input value={n.guardian?.fullName ?? ""} onChange={(e) => update(n.id, { guardian: { ...(n.guardian ?? { fullName: "", relation: "Guardian" }), fullName: e.target.value } })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase text-muted-foreground">Guardian relation</Label>
                      <Select value={n.guardian?.relation ?? "Guardian"} onValueChange={(v) => update(n.id, { guardian: { ...(n.guardian ?? { fullName: "", relation: v }), relation: v } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RELATION_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {value.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <AllocationMeter segments={value.map((n) => ({ id: n.id, label: n.fullName || `Nominee`, value: Number(n.sharePct) || 0 }))} />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
