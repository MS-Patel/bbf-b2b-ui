import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "../SectionCard";
import { ValidationBanner } from "../ValidationBanner";
import { COUNTRY_OPTIONS, FATCA_CLASSIFICATIONS } from "../../constants";
import type { FatcaData, TaxResidency } from "../../types";
import { cn } from "@/lib/utils";

export interface Step3Props {
  value: FatcaData;
  onChange: (next: FatcaData) => void;
}

export function Step3FatcaTaxation({ value, onChange }: Step3Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const addResidency = () => {
    const r: TaxResidency = { id: `res_${Date.now()}`, country: "", tin: "" };
    onChange({ ...value, residencies: [...value.residencies, r] });
  };
  const updateResidency = (id: string, patch: Partial<TaxResidency>) => {
    onChange({ ...value, residencies: value.residencies.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  };
  const removeResidency = (id: string) => onChange({ ...value, residencies: value.residencies.filter((r) => r.id !== id) });

  const isUsPerson = value.residencies.some((r) => r.country === "United States") || value.usPerson;

  return (
    <div className="space-y-5">
      {isUsPerson && (
        <ValidationBanner
          tone="warning"
          title="US person identified"
          description="FATCA reporting will apply. Form W-9 / W-8BEN may be required and additional product restrictions may trigger downstream."
        />
      )}

      <SectionCard
        title="Tax residency"
        description="Declare every jurisdiction where the investor is a tax resident."
        aside={<Button type="button" size="sm" variant="outline" onClick={addResidency}><Plus className="h-4 w-4" /> Add residency</Button>}
      >
        <div className="space-y-3">
          {value.residencies.map((r, idx) => (
            <div key={r.id} className="grid items-end gap-3 rounded-lg border border-border bg-background/40 p-3 sm:grid-cols-[1fr_1fr_1fr_40px]">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">Country</Label>
                <Select value={r.country} onValueChange={(v) => updateResidency(r.id, { country: v })}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>{COUNTRY_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">TIN</Label>
                <Input value={r.tin} onChange={(e) => updateResidency(r.id, { tin: e.target.value })} placeholder="Taxpayer ID" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase text-muted-foreground">If unavailable, reason</Label>
                <Input value={r.tinUnavailableReason ?? ""} onChange={(e) => updateResidency(r.id, { tinUnavailableReason: e.target.value })} placeholder="Optional" />
              </div>
              <Button type="button" size="icon" variant="ghost" disabled={value.residencies.length === 1} onClick={() => removeResidency(r.id)} aria-label="Remove">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Classification & declarations">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>FATCA classification</Label>
            <Select value={value.classification} onValueChange={(v) => onChange({ ...value, classification: v as FatcaData["classification"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FATCA_CLASSIFICATIONS.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm">
              <Checkbox checked={value.pep} onCheckedChange={(c) => onChange({ ...value, pep: !!c })} className="mt-0.5" />
              <span>Investor is a Politically Exposed Person (PEP) or related to one</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm">
              <Checkbox checked={value.usPerson} onCheckedChange={(c) => onChange({ ...value, usPerson: !!c })} className="mt-0.5" />
              <span>Investor is a US person under FATCA definitions</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm">
              <Checkbox checked={value.declarationAck} onCheckedChange={(c) => onChange({ ...value, declarationAck: !!c })} className="mt-0.5" />
              <span>I confirm the above declarations are accurate and complete</span>
            </label>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-xl border border-border bg-card">
        <button type="button" onClick={() => setAdvancedOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3 hover:bg-secondary/40">
          <div className="text-left">
            <p className="text-sm font-semibold">Advanced compliance (CRS, GIIN)</p>
            <p className="text-xs text-muted-foreground">Optional — for entities and financial institutions</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
        </button>
        {advancedOpen && (
          <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={!!value.crsControllingPerson} onCheckedChange={(c) => onChange({ ...value, crsControllingPerson: !!c })} className="mt-0.5" />
              <span>Investor is a controlling person of a CRS-reportable entity</span>
            </label>
            <div className="space-y-1.5">
              <Label>GIIN (if financial institution)</Label>
              <Input value={value.giinNumber ?? ""} onChange={(e) => onChange({ ...value, giinNumber: e.target.value })} placeholder="XXXXXX.XXXXX.XX.XXX" className="font-mono" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
