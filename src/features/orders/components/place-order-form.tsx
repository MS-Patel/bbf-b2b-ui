import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import { useEligibleClientsQuery, useMandatesQuery, usePlaceOrderMutation, useSchemesQuery } from "@/features/orders/api";
import { ORDER_TYPE_LABEL, type OrderType, type PlacedByRole, type SchemeLite } from "@/types/orders";
import type { ClientLite } from "@/types/rm";
import { formatCompactINR, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  scope: "all" | "rm" | "distributor";
  placedBy: { id: string; name: string; role: PlacedByRole };
  eyebrow: string;
  /** Where to navigate after success / cancel (the orders register). */
  backTo: "/app/admin/orders" | "/app/rm/orders" | "/app/distributor/orders";
  /** Optional pre-selected client (e.g., deep-link from converted lead). */
  preselectedClientId?: string;
}

type Step = 1 | 2 | 3;

const RISK_LEVEL: Record<string, number> = { Conservative: 1, Moderate: 2, Aggressive: 3 };
const SCHEME_RISK: Record<string, number> = { Low: 1, Moderate: 2, High: 3, "Very High": 4 };

export function PlaceOrderForm({ scope, placedBy, eyebrow, backTo, preselectedClientId }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [client, setClient] = useState<ClientLite | null>(null);
  const [type, setType] = useState<OrderType>("lump_sum");
  const [scheme, setScheme] = useState<SchemeLite | null>(null);
  const [schemeQuery, setSchemeQuery] = useState("");

  const [amount, setAmount] = useState<number>(10000);
  const [folio, setFolio] = useState("");
  const [paymentMode, setPaymentMode] = useState<"netbanking" | "upi" | "neft">("netbanking");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly">("monthly");
  const [sipDate, setSipDate] = useState(5);
  const [tenure, setTenure] = useState<string>("36");
  const [mandateId, setMandateId] = useState("");
  const [units, setUnits] = useState<number>(0);
  const [switchAll, setSwitchAll] = useState(false);
  const [switchTargetCode, setSwitchTargetCode] = useState("");
  const [redeemAll, setRedeemAll] = useState(false);
  const [payoutBank, setPayoutBank] = useState("HDFC Bank ••••2210");
  const [reference, setReference] = useState("");

  const [investorConsent, setInvestorConsent] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  const [cutoffAck, setCutoffAck] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const { data: clients } = useEligibleClientsQuery({ scope, ownerId: placedBy.id });
  const { data: schemes } = useSchemesQuery(schemeQuery);
  const { data: mandates } = useMandatesQuery(client?.id);
  const place = usePlaceOrderMutation();

  useEffect(() => {
    if (preselectedClientId && clients && !client) {
      const found = clients.find((c) => c.id === preselectedClientId);
      if (found) {
        setClient(found);
        setStep(2);
      }
    }
  }, [preselectedClientId, clients, client]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.fullName} ${c.email}`.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const indicativeUnits = scheme ? +(amount / scheme.latestNav).toFixed(3) : 0;
  const riskMismatch =
    !!scheme && !!client && SCHEME_RISK[scheme.riskBand]! > (RISK_LEVEL[client.riskProfile] ?? 1) + 1;

  const canProceedStep2 =
    !!scheme &&
    (type === "lump_sum"
      ? amount >= (scheme.minLumpSum ?? 500)
      : type === "sip"
        ? amount >= (scheme.minSip ?? 500) && !!mandateId
        : type === "switch"
          ? !!switchTargetCode && (switchAll || units > 0)
          : amount >= 500 || redeemAll);

  const canSubmit = investorConsent && riskAck && cutoffAck && !place.isPending;

  function goBackToRegister() {
    navigate({ to: backTo });
  }

  async function submit() {
    if (!client || !scheme) return;
    const consent = { investorConsent, riskAck, cutoffAck };
    try {
      let input;
      if (type === "lump_sum") {
        input = { type: "lump_sum" as const, clientId: client.id, schemeCode: scheme.code, amount, folio, paymentMode, reference, consent };
      } else if (type === "sip") {
        input = {
          type: "sip" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          amount,
          frequency,
          sipDate,
          tenure: tenure === "perpetual" ? ("perpetual" as const) : Number(tenure),
          mandateId,
          reference,
          consent,
        };
      } else if (type === "switch") {
        input = {
          type: "switch" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          switchTargetCode,
          units: switchAll ? 9999 : units,
          switchAll,
          reference,
          consent,
        };
      } else {
        input = { type: "redeem" as const, clientId: client.id, schemeCode: scheme.code, amount, redeemAll, payoutBank, reference, consent };
      }
      const order = await place.mutateAsync({ input, placedBy });
      toast.success("Order placed", {
        description: `${ORDER_TYPE_LABEL[order.type]} for ${client.fullName} — ${order.id}`,
      });
      navigate({ to: backTo });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not place order";
      toast.error("Order failed", { description: message });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Place order on behalf of investor"
        description={`Step ${step} of 3 — ${step === 1 ? "Pick client" : step === 2 ? "Order ticket" : "Confirm & consent"}`}
        actions={
          <Button variant="ghost" className="gap-1.5" onClick={goBackToRegister}>
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-3xl space-y-5 px-6 py-6 sm:px-8">
        <Stepper step={step} />

        {step === 1 && (
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search verified clients…" className="pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">Only KYC-verified clients are eligible to invest.</p>
              <div className="space-y-2">
                {filteredClients.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No verified clients yet — invite via Onboarding.
                    </CardContent>
                  </Card>
                )}
                {filteredClients.slice(0, 25).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClient(c);
                      setStep(2);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-secondary/40",
                      client?.id === c.id && "border-primary bg-secondary/40",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted-foreground">{c.riskProfile}</span>
                      <span className="text-sm font-semibold tabular-nums">{formatCompactINR(c.aum)}</span>
                      <StatusBadge tone="success" label="KYC ✓" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && client && (
          <Card className="shadow-card">
            <CardContent className="space-y-5 p-5">
              <Card className="bg-secondary/30">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Investor</p>
                    <p className="font-semibold">{client.fullName}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change</Button>
                </CardContent>
              </Card>

              <Tabs value={type} onValueChange={(v) => setType(v as OrderType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="lump_sum">Lump-sum</TabsTrigger>
                  <TabsTrigger value="sip">SIP</TabsTrigger>
                  <TabsTrigger value="switch">Switch</TabsTrigger>
                  <TabsTrigger value="redeem">Redeem</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-1.5">
                <Label>Scheme</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={scheme ? scheme.name : schemeQuery}
                    onChange={(e) => {
                      setScheme(null);
                      setSchemeQuery(e.target.value);
                    }}
                    placeholder="Search by scheme or AMC…"
                    className="pl-9"
                  />
                </div>
                {!scheme && schemeQuery && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                    {(schemes ?? []).slice(0, 8).map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => setScheme(s)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.amc} · {s.category}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">NAV ₹{s.latestNav}</span>
                      </button>
                    ))}
                    {schemes && schemes.length === 0 && (
                      <p className="p-3 text-xs text-muted-foreground">No schemes match — check master data sync.</p>
                    )}
                  </div>
                )}
                {scheme && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge tone="info" label={scheme.category} dot={false} />
                    <span>NAV ₹{scheme.latestNav} · as of {scheme.navAsOf}</span>
                    <span>· Cut-off {scheme.cutoff}</span>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setScheme(null)}>Change</Button>
                  </div>
                )}
              </div>

              {scheme && type === "lump_sum" && (
                <LumpSumFields amount={amount} setAmount={setAmount} folio={folio} setFolio={setFolio} paymentMode={paymentMode} setPaymentMode={setPaymentMode} indicativeUnits={indicativeUnits} />
              )}
              {scheme && type === "sip" && (
                <SipFields amount={amount} setAmount={setAmount} frequency={frequency} setFrequency={setFrequency} sipDate={sipDate} setSipDate={setSipDate} tenure={tenure} setTenure={setTenure} mandateId={mandateId} setMandateId={setMandateId} mandates={mandates ?? []} />
              )}
              {scheme && type === "switch" && (
                <SwitchFields units={units} setUnits={setUnits} switchAll={switchAll} setSwitchAll={setSwitchAll} switchTargetCode={switchTargetCode} setSwitchTargetCode={setSwitchTargetCode} excludeCode={scheme.code} />
              )}
              {scheme && type === "redeem" && (
                <RedeemFields amount={amount} setAmount={setAmount} redeemAll={redeemAll} setRedeemAll={setRedeemAll} payoutBank={payoutBank} setPayoutBank={setPayoutBank} />
              )}

              {scheme && riskMismatch && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground dark:text-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Scheme risk band <strong>{scheme.riskBand}</strong> is higher than client&apos;s <strong>{client.riskProfile}</strong> profile.
                    Acknowledge in the next step.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && client && scheme && (
          <Card className="shadow-card">
            <CardContent className="space-y-5 p-5">
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <Row k="Investor" v={client.fullName} />
                  <Row k="Order type" v={ORDER_TYPE_LABEL[type]} />
                  <Row k="Scheme" v={scheme.name} />
                  {type !== "switch" && type !== "redeem" && <Row k="Amount" v={formatINR(amount)} />}
                  {type === "lump_sum" && <Row k="Indicative units" v={indicativeUnits.toFixed(3)} />}
                  {type === "lump_sum" && <Row k="Payment" v={paymentMode.toUpperCase()} />}
                  {type === "sip" && <Row k="Frequency" v={`${frequency} on day ${sipDate}`} />}
                  {type === "sip" && <Row k="Tenure" v={tenure === "perpetual" ? "Perpetual" : `${tenure} months`} />}
                  {type === "sip" && <Row k="Mandate" v={mandates?.find((m) => m.id === mandateId)?.bank ?? mandateId} />}
                  {type === "switch" && <Row k="To scheme" v={switchTargetCode} />}
                  {type === "switch" && <Row k="Units" v={switchAll ? "All units" : units.toString()} />}
                  {type === "redeem" && <Row k="Amount" v={redeemAll ? "All units" : formatINR(amount)} />}
                  {type === "redeem" && <Row k="Payout to" v={payoutBank} />}
                </CardContent>
              </Card>

              <div className="space-y-1.5">
                <Label htmlFor="ref">Reference (call ID, email subject)</Label>
                <Textarea id="ref" value={reference} onChange={(e) => setReference(e.target.value)} rows={2} placeholder="Optional internal note" />
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <ConsentRow checked={investorConsent} onChange={setInvestorConsent} label="Investor consent received via call/email" />
                <ConsentRow checked={riskAck} onChange={setRiskAck} label={riskMismatch ? "I acknowledge the scheme risk exceeds the investor's profile" : "Risk profile reviewed with investor"} />
                <ConsentRow checked={cutoffAck} onChange={setCutoffAck} label={`I understand the ${scheme.cutoff} cut-off applies for NAV allocation`} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-5 py-3 shadow-card">
          {step > 1 ? (
            <Button variant="ghost" className="gap-1.5" onClick={() => setStep((step - 1) as Step)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <Button variant="ghost" className="gap-1.5" onClick={goBackToRegister}>
              Cancel
            </Button>
          )}
          {step === 1 ? (
            <span />
          ) : step === 2 ? (
            <Button disabled={!canProceedStep2} className="gap-1.5" onClick={() => setStep(3)}>
              Review <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={!canSubmit} className="gap-1.5" onClick={submit}>
              {place.isPending ? "Placing…" : (<><Check className="h-4 w-4" /> Place order</>)}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className={cn("h-1.5 flex-1 rounded-full bg-muted", step >= n && "bg-primary")} />
      ))}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="text-right text-sm font-medium">{v}</span>
    </div>
  );
}

function ConsentRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

function LumpSumFields({ amount, setAmount, folio, setFolio, paymentMode, setPaymentMode, indicativeUnits }: {
  amount: number; setAmount: (n: number) => void; folio: string; setFolio: (s: string) => void;
  paymentMode: "netbanking" | "upi" | "neft"; setPaymentMode: (m: "netbanking" | "upi" | "neft") => void; indicativeUnits: number;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Amount</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <div className="flex flex-wrap gap-2">
          {[5000, 10000, 25000, 50000, 100000].map((v) => (
            <Button key={v} type="button" size="sm" variant="outline" onClick={() => setAmount(v)}>
              {formatINR(v)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Indicative units: <span className="font-semibold tabular-nums text-foreground">{indicativeUnits.toFixed(3)}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Folio (optional)</Label>
          <Input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="New folio" />
        </div>
        <div className="space-y-1.5">
          <Label>Payment mode</Label>
          <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as "netbanking" | "upi" | "neft")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="netbanking">Net banking</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="neft">NEFT/RTGS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function SipFields({ amount, setAmount, frequency, setFrequency, sipDate, setSipDate, tenure, setTenure, mandateId, setMandateId, mandates }: {
  amount: number; setAmount: (n: number) => void;
  frequency: "monthly" | "quarterly"; setFrequency: (f: "monthly" | "quarterly") => void;
  sipDate: number; setSipDate: (d: number) => void;
  tenure: string; setTenure: (t: string) => void;
  mandateId: string; setMandateId: (id: string) => void;
  mandates: Array<{ id: string; bank: string; maxAmount: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>SIP amount</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <div className="flex flex-wrap gap-2">
          {[1000, 2500, 5000, 10000, 25000].map((v) => (
            <Button key={v} type="button" size="sm" variant="outline" onClick={() => setAmount(v)}>{formatINR(v)}</Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as "monthly" | "quarterly")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>SIP date</Label>
          <Select value={sipDate.toString()} onValueChange={(v) => setSipDate(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 5, 7, 10, 15, 20, 25, 28].map((d) => (
                <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tenure</Label>
          <Select value={tenure} onValueChange={setTenure}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 months</SelectItem>
              <SelectItem value="24">24 months</SelectItem>
              <SelectItem value="36">36 months</SelectItem>
              <SelectItem value="60">60 months</SelectItem>
              <SelectItem value="perpetual">Perpetual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Mandate (UMRN)</Label>
        {mandates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            No active mandates for this client. Initiate a new e-NACH mandate first.
          </p>
        ) : (
          <Select value={mandateId} onValueChange={setMandateId}>
            <SelectTrigger><SelectValue placeholder="Pick mandate" /></SelectTrigger>
            <SelectContent>
              {mandates.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.bank} · up to {formatINR(m.maxAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function SwitchFields({ units, setUnits, switchAll, setSwitchAll, switchTargetCode, setSwitchTargetCode, excludeCode }: {
  units: number; setUnits: (n: number) => void;
  switchAll: boolean; setSwitchAll: (b: boolean) => void;
  switchTargetCode: string; setSwitchTargetCode: (s: string) => void;
  excludeCode: string;
}) {
  const { data: schemes } = useSchemesQuery("");
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={switchAll} onCheckedChange={(v) => setSwitchAll(!!v)} /> Switch all units
      </label>
      {!switchAll && (
        <div className="space-y-1.5">
          <Label>Units</Label>
          <Input type="number" step="0.001" value={units} onChange={(e) => setUnits(Number(e.target.value))} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Target scheme</Label>
        <Select value={switchTargetCode} onValueChange={setSwitchTargetCode}>
          <SelectTrigger><SelectValue placeholder="Pick scheme" /></SelectTrigger>
          <SelectContent>
            {(schemes ?? []).filter((s) => s.code !== excludeCode).map((s) => (
              <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function RedeemFields({ amount, setAmount, redeemAll, setRedeemAll, payoutBank, setPayoutBank }: {
  amount: number; setAmount: (n: number) => void;
  redeemAll: boolean; setRedeemAll: (b: boolean) => void;
  payoutBank: string; setPayoutBank: (s: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={redeemAll} onCheckedChange={(v) => setRedeemAll(!!v)} /> Redeem all units
      </label>
      {!redeemAll && (
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Payout bank</Label>
        <Input value={payoutBank} onChange={(e) => setPayoutBank(e.target.value)} />
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-info">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Funds typically credit T+1 (equity) or T+0 (liquid).</span>
      </div>
    </div>
  );
}
