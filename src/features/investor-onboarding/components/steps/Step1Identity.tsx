import { useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../SectionCard";
import { AsyncFieldStatus } from "../AsyncFieldStatus";
import { ValidationBanner } from "../ValidationBanner";
import { HOLDING_TYPE_OPTIONS, INVESTOR_TYPE_OPTIONS, RELATION_OPTIONS } from "../../constants";
import { DUPLICATE_PANS } from "../../fixtures";
import type { IdentityData, JointHolder } from "../../types";

export interface Step1Props {
  value: IdentityData;
  onChange: (next: IdentityData) => void;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function Step1Identity({ value, onChange }: Step1Props) {
  // Mock async PAN lookup
  useEffect(() => {
    const pan = value.pan.trim().toUpperCase();
    if (!pan) {
      if (value.panLookupStatus !== "idle") onChange({ ...value, panLookupStatus: "idle", duplicateInvestorId: undefined });
      return;
    }
    if (!PAN_REGEX.test(pan)) {
      if (value.panLookupStatus !== "invalid") onChange({ ...value, panLookupStatus: "invalid", duplicateInvestorId: undefined });
      return;
    }
    if (value.panLookupStatus === "verified" || value.panLookupStatus === "duplicate") return;
    onChange({ ...value, panLookupStatus: "checking" });
    const t = setTimeout(() => {
      if (DUPLICATE_PANS.has(pan)) {
        onChange({ ...value, pan, panLookupStatus: "duplicate", duplicateInvestorId: "inv_92341" });
      } else {
        onChange({ ...value, pan, panLookupStatus: "verified", duplicateInvestorId: undefined });
      }
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pan]);

  const set = <K extends keyof IdentityData>(k: K, v: IdentityData[K]) => onChange({ ...value, [k]: v });

  const addJoint = () => {
    const jh: JointHolder = { id: `jh_${Date.now()}`, fullName: "", pan: "", relation: "Spouse" };
    onChange({ ...value, jointHolders: [...value.jointHolders, jh] });
  };
  const updateJoint = (id: string, patch: Partial<JointHolder>) => {
    onChange({ ...value, jointHolders: value.jointHolders.map((j) => (j.id === id ? { ...j, ...patch } : j)) });
  };
  const removeJoint = (id: string) => onChange({ ...value, jointHolders: value.jointHolders.filter((j) => j.id !== id) });

  const isMinor = value.investorType === "minor";
  const isJoint = value.investorType === "joint";
  const isCorporate = value.investorType === "corporate";

  return (
    <div className="space-y-5">
      {value.panLookupStatus === "duplicate" && (
        <ValidationBanner
          tone="warning"
          title="Existing investor found with this PAN"
          description="An active folio already exists. Confirm intent before continuing — onboarding may need to be merged."
          actions={<Button type="button" variant="outline" size="sm">View existing investor</Button>}
        />
      )}

      <SectionCard title="Primary identity" description="PAN drives KYC, FATCA and tax. Verify carefully.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pan">PAN</Label>
            <div className="relative">
              <Input
                id="pan"
                value={value.pan}
                maxLength={10}
                onChange={(e) => set("pan", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="font-mono uppercase tracking-wider"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Format: 5 letters · 4 digits · 1 letter</p>
              <AsyncFieldStatus status={value.panLookupStatus} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Investor type</Label>
            <Select value={value.investorType} onValueChange={(v) => set("investorType", v as IdentityData["investorType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVESTOR_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">{isCorporate ? "Entity name" : "Full name (as per PAN)"}</Label>
            <Input id="fullName" value={value.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob">{isCorporate ? "Date of incorporation" : "Date of birth"}</Label>
            <Input
              id="dob"
              type="date"
              value={isCorporate ? value.incorporationDate ?? "" : value.dateOfBirth ?? ""}
              onChange={(e) => set(isCorporate ? "incorporationDate" : "dateOfBirth", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Holding type</Label>
            <Select value={value.holdingType} onValueChange={(v) => set("holdingType", v as IdentityData["holdingType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOLDING_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={value.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+91 98XXXXXXXX" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {isMinor && (
        <SectionCard title="Guardian" description="Required for minor investors. Guardian must be KYC-verified.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Guardian name</Label>
              <Input value={value.guardian?.fullName ?? ""} onChange={(e) => set("guardian", { ...(value.guardian ?? { fullName: "", relation: "Father" }), fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={value.guardian?.relation ?? "Father"} onValueChange={(v) => set("guardian", { ...(value.guardian ?? { fullName: "", relation: v }), relation: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATION_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Guardian PAN</Label>
              <Input value={value.guardian?.pan ?? ""} maxLength={10} className="font-mono uppercase" onChange={(e) => set("guardian", { ...(value.guardian ?? { fullName: "", relation: "Father" }), pan: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1.5">
              <Label>Guardian mobile</Label>
              <Input value={value.guardian?.mobile ?? ""} onChange={(e) => set("guardian", { ...(value.guardian ?? { fullName: "", relation: "Father" }), mobile: e.target.value })} />
            </div>
          </div>
        </SectionCard>
      )}

      {isJoint && (
        <SectionCard
          title="Joint holders"
          description="Add second and third holders. Order matters for distribution."
          aside={<Button type="button" size="sm" variant="outline" onClick={addJoint}><Plus className="h-4 w-4" /> Add holder</Button>}
        >
          {value.jointHolders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No joint holders added yet.</p>
          ) : (
            <div className="space-y-3">
              {value.jointHolders.map((jh, idx) => (
                <div key={jh.id} className="grid items-end gap-3 rounded-lg border border-border bg-background/40 p-3 sm:grid-cols-[1fr_1fr_180px_40px]">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase text-muted-foreground">Holder {idx + 2} name</Label>
                    <Input value={jh.fullName} onChange={(e) => updateJoint(jh.id, { fullName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase text-muted-foreground">PAN</Label>
                    <Input value={jh.pan} maxLength={10} className="font-mono uppercase" onChange={(e) => updateJoint(jh.id, { pan: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase text-muted-foreground">Relation</Label>
                    <Select value={jh.relation} onValueChange={(v) => updateJoint(jh.id, { relation: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{RELATION_OPTIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeJoint(jh.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
