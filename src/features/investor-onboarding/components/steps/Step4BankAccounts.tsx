import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Star, Trash2, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { SectionCard } from "../SectionCard";
import { AsyncFieldStatus } from "../AsyncFieldStatus";
import { BANK_ACCOUNT_TYPES } from "../../constants";
import { MOCK_IFSC } from "../../fixtures";
import type { BankAccount, BankVerifyStatus } from "../../types";
import { cn } from "@/lib/utils";

export interface Step4Props {
  value: BankAccount[];
  onChange: (next: BankAccount[]) => void;
}

const VERIFY_TONE: Record<BankVerifyStatus, StatusTone> = {
  unverified: "warning",
  verifying: "info",
  verified: "success",
  failed: "destructive",
};

function emptyBank(): BankAccount {
  return {
    id: `bk_${Date.now()}`,
    bankName: "",
    branch: "",
    ifsc: "",
    accountNumber: "",
    accountType: "savings",
    holderName: "",
    primary: false,
    active: true,
    verifyStatus: "unverified",
    ifscLookupStatus: "idle",
  };
}

export function Step4BankAccounts({ value, onChange }: Step4Props) {
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const upsert = (b: BankAccount) => {
    const exists = value.some((x) => x.id === b.id);
    const banks = exists ? value.map((x) => (x.id === b.id ? b : x)) : [...value, b];
    // ensure exactly one primary if any active
    const hasPrimary = banks.some((x) => x.primary && x.active);
    if (!hasPrimary && banks.length > 0) banks[0].primary = true;
    onChange(banks);
  };

  const setPrimary = (id: string) => onChange(value.map((b) => ({ ...b, primary: b.id === id })));
  const toggleActive = (id: string) => onChange(value.map((b) => (b.id === id ? { ...b, active: !b.active, primary: !b.active ? b.primary : false } : b)));
  const remove = (id: string) => onChange(value.filter((b) => b.id !== id));

  return (
    <div className="space-y-5">
      <SectionCard
        title="Bank accounts"
        description="Add bank accounts for purchases, SIPs and redemptions. One must be designated primary."
        aside={<Button type="button" size="sm" variant="outline" onClick={() => setEditing(emptyBank())}><Plus className="h-4 w-4" /> Add account</Button>}
      >
        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/40 px-6 py-10 text-center">
            <p className="text-sm font-medium">No bank accounts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add at least one verified account before continuing.</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setEditing(emptyBank())}>
              <Plus className="h-4 w-4" /> Add account
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {value.map((b) => (
              <div key={b.id} className={cn("flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4", !b.active && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold">{b.bankName || "Unnamed bank"}</h4>
                      {b.primary && b.active && <StatusBadge tone="info" label="Primary" />}
                      {!b.active && <StatusBadge tone="muted" label="Inactive" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{b.branch || "—"}</p>
                  </div>
                  <StatusBadge tone={VERIFY_TONE[b.verifyStatus]} label={b.verifyStatus} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">IFSC</dt><dd className="font-mono">{b.ifsc || "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Account no.</dt><dd className="font-mono">{b.accountNumber ? `••••${b.accountNumber.slice(-4)}` : "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Type</dt><dd className="uppercase">{b.accountType}</dd></div>
                  <div><dt className="text-muted-foreground">Holder</dt><dd className="truncate">{b.holderName || "—"}</dd></div>
                </dl>
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
                  {b.active && !b.primary && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setPrimary(b.id)}><Star className="h-3.5 w-3.5" /> Set primary</Button>
                  )}
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(b)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => toggleActive(b.id)}><Power className="h-3.5 w-3.5" /> {b.active ? "Deactivate" : "Activate"}</Button>
                  <Button type="button" size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <BankEditorDrawer
        open={!!editing}
        bank={editing}
        onClose={() => setEditing(null)}
        onSave={(b) => { upsert(b); setEditing(null); }}
      />
    </div>
  );
}

function BankEditorDrawer({ open, bank, onClose, onSave }: { open: boolean; bank: BankAccount | null; onClose: () => void; onSave: (b: BankAccount) => void }) {
  const [draft, setDraft] = useState<BankAccount | null>(bank);

  useEffect(() => { setDraft(bank); }, [bank]);

  useEffect(() => {
    if (!draft) return;
    const ifsc = draft.ifsc.trim().toUpperCase();
    if (ifsc.length !== 11) {
      if (draft.ifscLookupStatus !== "idle") setDraft({ ...draft, ifscLookupStatus: "idle" });
      return;
    }
    if (draft.ifscLookupStatus === "found") return;
    setDraft({ ...draft, ifscLookupStatus: "checking" });
    const t = setTimeout(() => {
      const found = MOCK_IFSC[ifsc];
      if (found) setDraft((d) => d && { ...d, ifsc, ifscLookupStatus: "found", bankName: found.bankName, branch: found.branch });
      else setDraft((d) => d && { ...d, ifsc, ifscLookupStatus: "invalid" });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.ifsc]);

  if (!draft) return null;

  const verify = () => {
    setDraft({ ...draft, verifyStatus: "verifying" });
    setTimeout(() => setDraft((d) => d && { ...d, verifyStatus: "verified" }), 900);
  };

  const set = <K extends keyof BankAccount>(k: K, v: BankAccount[K]) => setDraft({ ...draft, [k]: v });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{bank?.bankName ? "Edit bank account" : "Add bank account"}</SheetTitle>
          <SheetDescription>IFSC lookup auto-fills bank and branch. Penny-drop verification recommended.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>IFSC</Label>
            <div className="flex items-center gap-2">
              <Input value={draft.ifsc} maxLength={11} className="font-mono uppercase" onChange={(e) => set("ifsc", e.target.value.toUpperCase())} placeholder="HDFC0000123" />
              <AsyncFieldStatus status={draft.ifscLookupStatus === "found" ? "found" : draft.ifscLookupStatus === "invalid" ? "invalid" : draft.ifscLookupStatus === "checking" ? "checking" : "idle"} />
            </div>
            <p className="text-[11px] text-muted-foreground">Try HDFC0000123, ICIC0000456, SBIN0000789, AXIS0000321</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bank</Label>
              <Input value={draft.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Input value={draft.branch} onChange={(e) => set("branch", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Account number</Label>
              <Input value={draft.accountNumber} onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={draft.accountType} onValueChange={(v) => set("accountType", v as BankAccount["accountType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BANK_ACCOUNT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Account holder</Label>
            <Input value={draft.holderName} onChange={(e) => set("holderName", e.target.value)} />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Penny-drop verification</p>
                <p className="text-xs text-muted-foreground">Confirms account is live and matches holder name.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={verify} disabled={draft.verifyStatus === "verifying"}>
                {draft.verifyStatus === "verifying" ? "Verifying…" : draft.verifyStatus === "verified" ? <><CheckCircle2 className="h-4 w-4 text-success" /> Verified</> : "Verify now"}
              </Button>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onSave(draft)}>Save account</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
