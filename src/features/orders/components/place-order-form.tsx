import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Search,
  AlertTriangle,
  Save,
  Sparkles,
  Clock,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Receipt,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/feedback/status-badge";
import {
  useEligibleClientsQuery,
  useMandatesQuery,
  usePlaceOrderMutation,
  useSchemesQuery,
} from "@/features/orders/api";
import {
  ORDER_TYPE_LABEL,
  type OrderType,
  type PlacedByRole,
  type SchemeLite,
  type SchemeCategory,
  type RiskBand,
  type Order,
} from "@/types/orders";
import type { ClientLite } from "@/types/rm";
import { formatCompactINR, formatINR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  holdingsForClient,
  recentClientIds,
  minutesToCutoff,
  formatCutoffCountdown,
  estimateCharges,
  evaluateSuitability,
} from "@/features/orders/helpers";
import {
  getDraft,
  saveDraft,
  deleteDraft,
  newDraftId,
  type OrderDraft,
} from "@/features/orders/drafts";

interface Props {
  scope: "all" | "rm" | "distributor";
  placedBy: { id: string; name: string; role: PlacedByRole };
  eyebrow: string;
  backTo: "/app/admin/orders" | "/app/rm/orders" | "/app/distributor/orders";
  preselectedClientId?: string;
  draftId?: string;
}

type Step = 1 | 2 | 3 | 4; // 4 = success
type PaymentMode = "netbanking" | "upi" | "neft";

const ORDER_TYPES: { value: OrderType; label: string; hint: string }[] = [
  { value: "lump_sum", label: "Lump-sum", hint: "One-time purchase" },
  { value: "sip", label: "SIP", hint: "Recurring purchase" },
  { value: "switch", label: "Switch", hint: "Move between schemes" },
  { value: "redeem", label: "Redeem", hint: "Withdraw to bank" },
  { value: "stp", label: "STP", hint: "Systematic transfer" },
  { value: "swp", label: "SWP", hint: "Systematic withdrawal" },
];

const ALL_CATEGORIES: SchemeCategory[] = [
  "Equity – Large Cap",
  "Equity – Mid Cap",
  "Equity – Small Cap",
  "Equity – Flexi Cap",
  "Hybrid",
  "Debt – Liquid",
  "Debt – Corporate Bond",
  "Gold",
  "International",
];

const RISK_TONE: Record<RiskBand, "info" | "success" | "warning" | "destructive"> = {
  Low: "success",
  Moderate: "info",
  High: "warning",
  "Very High": "destructive",
};

export function PlaceOrderForm({
  scope,
  placedBy,
  eyebrow,
  backTo,
  preselectedClientId,
  draftId,
}: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Draft id is stable for this session; created once.
  const draftIdRef = useRef<string>(draftId ?? newDraftId());
  const restoredRef = useRef(false);

  const [client, setClient] = useState<ClientLite | null>(null);
  const [type, setType] = useState<OrderType>("lump_sum");
  const [scheme, setScheme] = useState<SchemeLite | null>(null);
  const [schemeQuery, setSchemeQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | SchemeCategory>("all");

  const [amount, setAmount] = useState<number>(10000);
  const [folio, setFolio] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("netbanking");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly">("monthly");
  const [sipDate, setSipDate] = useState(5);
  const [tenure, setTenure] = useState<string>("36");
  const [mandateId, setMandateId] = useState("");
  const [units, setUnits] = useState<number>(0);
  const [switchAll, setSwitchAll] = useState(false);
  const [switchTargetCode, setSwitchTargetCode] = useState("");
  const [redeemAll, setRedeemAll] = useState(false);
  const [payoutBank, setPayoutBank] = useState("HDFC Bank ••••2210");
  const [transferDay, setTransferDay] = useState(5);
  const [installments, setInstallments] = useState<string>("12");
  const [reference, setReference] = useState("");

  const [investorConsent, setInvestorConsent] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  const [cutoffAck, setCutoffAck] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const { data: clients } = useEligibleClientsQuery({ scope, ownerId: placedBy.id });
  const { data: schemes } = useSchemesQuery(schemeQuery);
  const { data: mandates } = useMandatesQuery(client?.id);
  const place = usePlaceOrderMutation();

  // Tick the cut-off countdown every 30s.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Restore from draft on mount.
  useEffect(() => {
    if (restoredRef.current) return;
    if (!draftId || !clients) return;
    const d = getDraft(draftId);
    if (!d) {
      restoredRef.current = true;
      return;
    }
    restoredRef.current = true;
    draftIdRef.current = d.id;
    setType(d.type);
    if (d.clientId) {
      const c = clients.find((x) => x.id === d.clientId);
      if (c) setClient(c);
    }
    if (d.amount !== undefined) setAmount(d.amount);
    if (d.folio !== undefined) setFolio(d.folio);
    if (d.paymentMode) setPaymentMode(d.paymentMode);
    if (d.frequency) setFrequency(d.frequency);
    if (d.sipDate !== undefined) setSipDate(d.sipDate);
    if (d.tenure !== undefined) setTenure(d.tenure);
    if (d.mandateId !== undefined) setMandateId(d.mandateId);
    if (d.units !== undefined) setUnits(d.units);
    if (d.switchAll !== undefined) setSwitchAll(d.switchAll);
    if (d.switchTargetCode !== undefined) setSwitchTargetCode(d.switchTargetCode);
    if (d.redeemAll !== undefined) setRedeemAll(d.redeemAll);
    if (d.payoutBank !== undefined) setPayoutBank(d.payoutBank);
    if (d.transferDay !== undefined) setTransferDay(d.transferDay);
    if (d.installments !== undefined) setInstallments(d.installments);
    if (d.reference !== undefined) setReference(d.reference);
    // We don't yet have the scheme object — fetch via a simple search by code.
    if (d.schemeCode && d.schemeName) {
      // best-effort: trigger a query and hope it returns the scheme; fall back to label only.
      setSchemeQuery(d.schemeName);
    }
    if (d.step >= 1 && d.step <= 3) setStep(d.step as Step);
    toast.success("Draft restored");
  }, [draftId, clients]);

  // When schemes load and we have a pending draft scheme code, hydrate it.
  useEffect(() => {
    if (!schemes || scheme) return;
    const d = draftId ? getDraft(draftId) : undefined;
    if (d?.schemeCode) {
      const found = schemes.find((s) => s.code === d.schemeCode);
      if (found) setScheme(found);
    }
  }, [schemes, scheme, draftId]);

  // Preselect client deep-link.
  useEffect(() => {
    if (preselectedClientId && clients && !client) {
      const found = clients.find((c) => c.id === preselectedClientId);
      if (found) {
        setClient(found);
        if (step === 1) setStep(2);
      }
    }
  }, [preselectedClientId, clients, client, step]);

  // Recent clients suggested in step 1.
  const recentIds = useMemo(() => recentClientIds(5, placedBy.id), [placedBy.id]);
  const recentClients = useMemo(
    () => (clients ?? []).filter((c) => recentIds.includes(c.id)),
    [clients, recentIds],
  );

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.fullName} ${c.email}`.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const filteredSchemes = useMemo(() => {
    let list = schemes ?? [];
    if (categoryFilter !== "all") list = list.filter((s) => s.category === categoryFilter);
    return list;
  }, [schemes, categoryFilter]);

  const indicativeUnits = scheme ? +(amount / scheme.latestNav).toFixed(3) : 0;
  const suitability = evaluateSuitability(scheme, client?.riskProfile);
  const cutoffMins = scheme ? minutesToCutoff(scheme.cutoff, now) : 0;
  const charges = scheme ? estimateCharges(amount, scheme) : null;
  const holdings = client ? holdingsForClient(client.id) : [];

  const sourceHolding = scheme && client ? holdings.find((h) => h.schemeCode === scheme.code) : undefined;

  const canProceedStep2 =
    !!scheme &&
    (type === "lump_sum"
      ? amount >= (scheme.minLumpSum ?? 500)
      : type === "sip"
        ? amount >= (scheme.minSip ?? 500) && !!mandateId
        : type === "switch"
          ? !!switchTargetCode && (switchAll || units > 0)
          : type === "redeem"
            ? amount >= 500 || redeemAll
            : type === "stp"
              ? !!switchTargetCode && amount >= 500
              : amount >= 500); // swp

  const canSubmit = investorConsent && riskAck && cutoffAck && !place.isPending && suitability.level !== "block" || (suitability.level === "block" && investorConsent && riskAck && cutoffAck && !place.isPending);

  function persistDraft(nextStep: Step) {
    if (nextStep === 4) return; // don't save success
    const d: OrderDraft = {
      id: draftIdRef.current,
      ownerId: placedBy.id,
      ownerRole: placedBy.role,
      clientId: client?.id,
      clientName: client?.fullName,
      type,
      schemeCode: scheme?.code,
      schemeName: scheme?.name,
      amount,
      folio,
      paymentMode,
      frequency,
      sipDate,
      tenure,
      mandateId,
      units,
      switchAll,
      switchTargetCode,
      redeemAll,
      payoutBank,
      transferDay,
      installments,
      reference,
      step: nextStep,
      updatedAt: new Date().toISOString(),
    };
    saveDraft(d);
  }

  function go(next: Step) {
    persistDraft(next);
    setStep(next);
  }

  function manualSave() {
    persistDraft(step);
    toast.success("Draft saved", { description: "You can resume from the orders page." });
  }

  function discardAndExit() {
    deleteDraft(draftIdRef.current);
    navigate({ to: backTo });
  }

  async function submit() {
    if (!client || !scheme) return;
    const consent = { investorConsent, riskAck, cutoffAck };
    try {
      let input;
      if (type === "lump_sum") {
        input = {
          type: "lump_sum" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          amount,
          folio,
          paymentMode,
          reference,
          consent,
        };
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
      } else if (type === "redeem") {
        input = {
          type: "redeem" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          amount,
          redeemAll,
          payoutBank,
          reference,
          consent,
        };
      } else if (type === "stp") {
        input = {
          type: "stp" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          switchTargetCode,
          amount,
          frequency,
          transferDay,
          installments: installments === "perpetual" ? ("perpetual" as const) : Number(installments),
          reference,
          consent,
        };
      } else {
        input = {
          type: "swp" as const,
          clientId: client.id,
          schemeCode: scheme.code,
          amount,
          frequency,
          transferDay,
          installments: installments === "perpetual" ? ("perpetual" as const) : Number(installments),
          payoutBank,
          reference,
          consent,
        };
      }
      const order = await place.mutateAsync({ input, placedBy });
      deleteDraft(draftIdRef.current);
      setPlacedOrder(order);
      setStep(4);
      toast.success("Order placed", {
        description: `${ORDER_TYPE_LABEL[order.type]} for ${client.fullName} — ${order.id}`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not place order";
      toast.error("Order failed", { description: message });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={step === 4 ? "Order placed" : "Place order on behalf of investor"}
        description={
          step === 4
            ? "Receipt below — share or place another."
            : `Step ${step} of 3 — ${step === 1 ? "Pick investor" : step === 2 ? "Order ticket" : "Confirm & consent"}`
        }
        actions={
          step !== 4 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={manualSave}>
                <Save className="h-4 w-4" /> Save draft
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={discardAndExit}>
                <X className="h-4 w-4" /> Discard
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="gap-1.5" onClick={() => navigate({ to: backTo })}>
              <ArrowLeft className="h-4 w-4" /> Back to orders
            </Button>
          )
        }
      />
      <div className="mx-auto w-full max-w-4xl space-y-5 px-6 py-6 sm:px-8">
        {step !== 4 && <Stepper step={step} />}

        {/* Sticky investor summary across steps 2/3 */}
        {step >= 2 && step <= 3 && client && (
          <ClientSummaryCard
            client={client}
            holdings={holdings}
            onChange={() => go(1)}
          />
        )}

        {step === 1 && (
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search verified investors…"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only KYC-verified investors are eligible to invest.
              </p>

              {recentClients.length > 0 && !clientSearch && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> Recent investors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClient(c);
                          go(2);
                        }}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:bg-secondary/40"
                      >
                        {c.fullName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {filteredClients.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No verified investors yet — invite via Onboarding.
                    </CardContent>
                  </Card>
                )}
                {filteredClients.slice(0, 25).map((c) => {
                  const h = holdingsForClient(c.id);
                  const totalInvested = h.reduce((sum, x) => sum + x.invested, 0);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClient(c);
                        go(2);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-secondary/40",
                        client?.id === c.id && "border-primary bg-secondary/40",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.email} · {h.length} {h.length === 1 ? "scheme" : "schemes"}
                          {totalInvested > 0 ? ` · ${formatCompactINR(totalInvested)} invested` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">{c.riskProfile}</span>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCompactINR(c.aum)}
                        </span>
                        <StatusBadge tone="success" label="KYC ✓" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && client && (
          <Card className="shadow-card">
            <CardContent className="space-y-5 p-5">
              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order type
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ORDER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setType(t.value);
                        // reset scheme-specific guards
                        if (t.value !== "switch" && t.value !== "stp") setSwitchTargetCode("");
                      }}
                      className={cn(
                        "flex flex-col items-start rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary",
                        type === t.value && "border-primary bg-primary/5 ring-1 ring-primary/20",
                      )}
                    >
                      <span className="text-sm font-semibold">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Scheme</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(v) => setCategoryFilter(v as "all" | SchemeCategory)}
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {ALL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                {!scheme && (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                    {filteredSchemes.slice(0, 12).map((s) => {
                      const sui = evaluateSuitability(s, client.riskProfile);
                      return (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => setScheme(s)}
                          className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{s.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {s.amc} · {s.category}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge tone={RISK_TONE[s.riskBand]} label={s.riskBand} dot={false} />
                            {sui.level === "warn" && (
                              <span className="text-[10px] text-warning">⚠ above profile</span>
                            )}
                            {sui.level === "block" && (
                              <span className="text-[10px] text-destructive">! way above</span>
                            )}
                            <span className="text-xs text-muted-foreground">NAV ₹{s.latestNav}</span>
                          </div>
                        </button>
                      );
                    })}
                    {filteredSchemes.length === 0 && (
                      <p className="p-3 text-xs text-muted-foreground">
                        No schemes match — adjust filters or check master data sync.
                      </p>
                    )}
                  </div>
                )}
                {scheme && (
                  <SchemeChip
                    scheme={scheme}
                    cutoffMins={cutoffMins}
                    onClear={() => setScheme(null)}
                    sourceHolding={sourceHolding}
                  />
                )}
              </div>

              {scheme && type === "lump_sum" && (
                <LumpSumFields
                  scheme={scheme}
                  amount={amount}
                  setAmount={setAmount}
                  folio={folio}
                  setFolio={setFolio}
                  paymentMode={paymentMode}
                  setPaymentMode={setPaymentMode}
                  indicativeUnits={indicativeUnits}
                  charges={charges}
                />
              )}
              {scheme && type === "sip" && (
                <SipFields
                  amount={amount}
                  setAmount={setAmount}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  sipDate={sipDate}
                  setSipDate={setSipDate}
                  tenure={tenure}
                  setTenure={setTenure}
                  mandateId={mandateId}
                  setMandateId={setMandateId}
                  mandates={mandates ?? []}
                />
              )}
              {scheme && type === "switch" && (
                <SwitchFields
                  units={units}
                  setUnits={setUnits}
                  switchAll={switchAll}
                  setSwitchAll={setSwitchAll}
                  switchTargetCode={switchTargetCode}
                  setSwitchTargetCode={setSwitchTargetCode}
                  excludeCode={scheme.code}
                  sourceHolding={sourceHolding}
                />
              )}
              {scheme && type === "redeem" && (
                <RedeemFields
                  scheme={scheme}
                  amount={amount}
                  setAmount={setAmount}
                  redeemAll={redeemAll}
                  setRedeemAll={setRedeemAll}
                  payoutBank={payoutBank}
                  setPayoutBank={setPayoutBank}
                  sourceHolding={sourceHolding}
                />
              )}
              {scheme && type === "stp" && (
                <StpFields
                  amount={amount}
                  setAmount={setAmount}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  transferDay={transferDay}
                  setTransferDay={setTransferDay}
                  installments={installments}
                  setInstallments={setInstallments}
                  switchTargetCode={switchTargetCode}
                  setSwitchTargetCode={setSwitchTargetCode}
                  excludeCode={scheme.code}
                />
              )}
              {scheme && type === "swp" && (
                <SwpFields
                  amount={amount}
                  setAmount={setAmount}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  transferDay={transferDay}
                  setTransferDay={setTransferDay}
                  installments={installments}
                  setInstallments={setInstallments}
                  payoutBank={payoutBank}
                  setPayoutBank={setPayoutBank}
                />
              )}

              {scheme && suitability.level !== "ok" && (
                <SuitabilityAlert level={suitability.level} message={suitability.message} />
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && client && scheme && (
          <Card className="shadow-card">
            <CardContent className="space-y-5 p-5">
              <ReviewSummary
                client={client}
                scheme={scheme}
                type={type}
                amount={amount}
                indicativeUnits={indicativeUnits}
                paymentMode={paymentMode}
                frequency={frequency}
                sipDate={sipDate}
                tenure={tenure}
                mandates={mandates ?? []}
                mandateId={mandateId}
                switchTargetCode={switchTargetCode}
                switchAll={switchAll}
                units={units}
                redeemAll={redeemAll}
                payoutBank={payoutBank}
                transferDay={transferDay}
                installments={installments}
                charges={charges}
                onEdit={() => go(2)}
              />

              <div className="space-y-1.5">
                <Label htmlFor="ref">Reference (call ID, email subject)</Label>
                <Textarea
                  id="ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  rows={2}
                  placeholder="Optional internal note"
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <ConsentRow
                  checked={investorConsent}
                  onChange={setInvestorConsent}
                  label="Investor consent received via call/email"
                />
                <ConsentRow
                  checked={riskAck}
                  onChange={setRiskAck}
                  label={
                    suitability.level !== "ok"
                      ? "I acknowledge the scheme risk exceeds the investor's profile"
                      : "Risk profile reviewed with investor"
                  }
                />
                <ConsentRow
                  checked={cutoffAck}
                  onChange={setCutoffAck}
                  label={`I understand the ${scheme.cutoff} cut-off applies for NAV allocation`}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && placedOrder && (
          <SuccessReceipt
            order={placedOrder}
            onPlaceAnother={() => {
              setPlacedOrder(null);
              draftIdRef.current = newDraftId();
              setScheme(null);
              setSchemeQuery("");
              setInvestorConsent(false);
              setRiskAck(false);
              setCutoffAck(false);
              setStep(2);
            }}
            backTo={backTo}
          />
        )}

        {step !== 4 && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-5 py-3 shadow-card">
            {step > 1 ? (
              <Button variant="ghost" className="gap-1.5" onClick={() => go((step - 1) as Step)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="ghost" className="gap-1.5" onClick={discardAndExit}>
                Cancel
              </Button>
            )}
            {step === 1 ? (
              <span />
            ) : step === 2 ? (
              <Button disabled={!canProceedStep2} className="gap-1.5" onClick={() => go(3)}>
                Review <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={!canSubmit} className="gap-1.5" onClick={submit}>
                {place.isPending ? (
                  "Placing…"
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Place order
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------ Sub-components ------------------------------ */

function Stepper({ step }: { step: Step }) {
  const labels = ["Investor", "Ticket", "Confirm"];
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex flex-1 flex-col gap-1">
          <div className={cn("h-1.5 rounded-full bg-muted", step >= n && "bg-primary")} />
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
              step >= n && "text-foreground",
            )}
          >
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ClientSummaryCard({
  client,
  holdings,
  onChange,
}: {
  client: ClientLite;
  holdings: Array<{ schemeName: string; invested: number; units: number }>;
  onChange: () => void;
}) {
  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card shadow-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {client.fullName
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor</p>
            <p className="font-semibold leading-tight">{client.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {client.riskProfile} · {client.email}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 items-center gap-4 text-xs sm:gap-6">
          <div>
            <p className="text-muted-foreground">AUM</p>
            <p className="font-semibold tabular-nums">{formatCompactINR(client.aum)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Schemes</p>
            <p className="font-semibold tabular-nums">{holdings.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Invested</p>
            <p className="font-semibold tabular-nums">
              {totalInvested > 0 ? formatCompactINR(totalInvested) : "—"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onChange}>
          Change
        </Button>
      </CardContent>
    </Card>
  );
}

function SchemeChip({
  scheme,
  cutoffMins,
  onClear,
  sourceHolding,
}: {
  scheme: SchemeLite;
  cutoffMins: number;
  onClear: () => void;
  sourceHolding?: { units: number; invested: number };
}) {
  const cutoffTone = cutoffMins < 0 ? "destructive" : cutoffMins < 60 ? "warning" : "info";
  return (
    <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge tone="info" label={scheme.category} dot={false} />
        <StatusBadge tone={RISK_TONE[scheme.riskBand]} label={scheme.riskBand + " risk"} dot={false} />
        <span className="text-muted-foreground">
          NAV ₹{scheme.latestNav} · as of {scheme.navAsOf}
        </span>
        <Button size="sm" variant="ghost" className="ml-auto h-7 px-2" onClick={onClear}>
          Change
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", `bg-${cutoffTone}/12 text-${cutoffTone}`)}>
          <Clock className="h-3 w-3" /> {formatCutoffCountdown(cutoffMins)}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          Exit load: {scheme.exitLoadDays > 0 ? `${scheme.exitLoadDays} days` : "Nil"}
        </span>
        {sourceHolding && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-success">
            <Wallet className="h-3 w-3" /> Existing: {sourceHolding.units.toFixed(3)} units ·{" "}
            {formatINR(sourceHolding.invested)}
          </span>
        )}
      </div>
    </div>
  );
}

function SuitabilityAlert({
  level,
  message,
}: {
  level: "warn" | "block";
  message: string;
}) {
  const tone = level === "block" ? "destructive" : "warning";
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-xs",
        tone === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-warning/30 bg-warning/10 text-warning-foreground dark:text-warning",
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}. Acknowledge in the next step.</span>
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

function ConsentRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5"
      />
      <span>{label}</span>
    </label>
  );
}

function ReviewSummary(props: {
  client: ClientLite;
  scheme: SchemeLite;
  type: OrderType;
  amount: number;
  indicativeUnits: number;
  paymentMode: PaymentMode;
  frequency: "monthly" | "quarterly";
  sipDate: number;
  tenure: string;
  mandates: Array<{ id: string; bank: string }>;
  mandateId: string;
  switchTargetCode: string;
  switchAll: boolean;
  units: number;
  redeemAll: boolean;
  payoutBank: string;
  transferDay: number;
  installments: string;
  charges: { stampDuty: number; exitLoad: string; stt: string } | null;
  onEdit: () => void;
}) {
  const { type, scheme, amount, indicativeUnits, charges } = props;
  return (
    <Card className="bg-secondary/30">
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Order summary
          </p>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={props.onEdit}>
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          <Row k="Investor" v={props.client.fullName} />
          <Row k="Order type" v={ORDER_TYPE_LABEL[type]} />
          <Row k="Scheme" v={scheme.name} />
          {(type === "lump_sum" || type === "sip" || type === "stp" || type === "swp") && (
            <Row k="Amount" v={formatINR(amount)} />
          )}
          {type === "lump_sum" && <Row k="Indicative units" v={indicativeUnits.toFixed(3)} />}
          {type === "lump_sum" && <Row k="Payment" v={props.paymentMode.toUpperCase()} />}
          {type === "sip" && <Row k="Frequency" v={`${props.frequency} on day ${props.sipDate}`} />}
          {type === "sip" && (
            <Row
              k="Tenure"
              v={props.tenure === "perpetual" ? "Perpetual" : `${props.tenure} months`}
            />
          )}
          {type === "sip" && (
            <Row
              k="Mandate"
              v={props.mandates.find((m) => m.id === props.mandateId)?.bank ?? props.mandateId}
            />
          )}
          {type === "switch" && <Row k="To scheme" v={props.switchTargetCode} />}
          {type === "switch" && (
            <Row k="Units" v={props.switchAll ? "All units" : props.units.toString()} />
          )}
          {type === "redeem" && (
            <Row k="Amount" v={props.redeemAll ? "All units" : formatINR(amount)} />
          )}
          {type === "redeem" && <Row k="Payout to" v={props.payoutBank} />}
          {(type === "stp" || type === "swp") && (
            <Row k="Schedule" v={`${props.frequency} on day ${props.transferDay}`} />
          )}
          {(type === "stp" || type === "swp") && (
            <Row
              k="Installments"
              v={props.installments === "perpetual" ? "Perpetual" : `${props.installments} installments`}
            />
          )}
          {type === "stp" && <Row k="To scheme" v={props.switchTargetCode} />}
          {type === "swp" && <Row k="Payout to" v={props.payoutBank} />}
        </div>
        {charges && (type === "lump_sum" || type === "sip") && (
          <div className="mt-3 space-y-1 rounded-lg border border-dashed border-border p-3 text-xs">
            <p className="font-semibold text-muted-foreground">Indicative charges</p>
            <Row k="Stamp duty" v={formatINR(charges.stampDuty, true)} />
            <Row k="Exit load" v={charges.exitLoad} />
            <Row k="STT" v={charges.stt} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuccessReceipt({
  order,
  onPlaceAnother,
  backTo,
}: {
  order: Order;
  onPlaceAnother: () => void;
  backTo: string;
}) {
  const navigate = useNavigate();
  return (
    <Card className="border-success/30 bg-gradient-to-br from-success/5 to-card shadow-card">
      <CardContent className="space-y-5 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Order accepted</h2>
          <p className="text-sm text-muted-foreground">
            We've queued your order with the exchange. You'll see status updates on the orders page.
          </p>
        </div>

        <Card className="bg-card text-left">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Order ID
              </span>
              <span className="font-mono text-sm font-semibold">{order.id}</span>
            </div>
            <Row k="Investor" v={order.clientName} />
            <Row k="Type" v={ORDER_TYPE_LABEL[order.type]} />
            <Row k="Scheme" v={order.schemeName} />
            {order.amount && <Row k="Amount" v={formatINR(order.amount)} />}
            {order.units && <Row k="Indicative units" v={order.units.toFixed(3)} />}
            <Row k="Placed at" v={formatDate(order.placedAt)} />
            <Row k="Status" v="Pending exchange ack" />
          </CardContent>
        </Card>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard?.writeText(order.id);
              toast.success("Order ID copied");
            }}
          >
            <Receipt className="h-4 w-4" /> Copy ID
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={onPlaceAnother}>
            <TrendingUp className="h-4 w-4" /> Place another
          </Button>
          <Button className="gap-1.5" onClick={() => navigate({ to: backTo })}>
            <ShieldCheck className="h-4 w-4" /> View orders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Type-specific fields ------------------------------ */

function AmountChips({ values, onPick }: { values: number[]; onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <Button key={v} type="button" size="sm" variant="outline" onClick={() => onPick(v)}>
          {formatINR(v)}
        </Button>
      ))}
    </div>
  );
}

function LumpSumFields({
  scheme,
  amount,
  setAmount,
  folio,
  setFolio,
  paymentMode,
  setPaymentMode,
  indicativeUnits,
  charges,
}: {
  scheme: SchemeLite;
  amount: number;
  setAmount: (n: number) => void;
  folio: string;
  setFolio: (s: string) => void;
  paymentMode: PaymentMode;
  setPaymentMode: (m: PaymentMode) => void;
  indicativeUnits: number;
  charges: { stampDuty: number; exitLoad: string; stt: string } | null;
}) {
  const belowMin = amount < scheme.minLumpSum;
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <AmountChips values={[5000, 10000, 25000, 50000, 100000]} onPick={setAmount} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Min: {formatINR(scheme.minLumpSum)} ·{" "}
            <span className="text-foreground">
              Indicative units:{" "}
              <strong className="tabular-nums">{indicativeUnits.toFixed(3)}</strong>
            </span>
          </span>
          {belowMin && <span className="text-destructive">Below scheme minimum</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Folio (optional)</Label>
          <Input
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            placeholder="New folio"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Payment mode</Label>
          <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="netbanking">Net banking</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="neft">NEFT/RTGS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {charges && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Stamp duty</p>
            <p className="font-semibold tabular-nums">{formatINR(charges.stampDuty, true)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Exit load</p>
            <p className="font-semibold">{charges.exitLoad}</p>
          </div>
          <div>
            <p className="text-muted-foreground">STT (purchase)</p>
            <p className="font-semibold">{charges.stt}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SipFields({
  amount,
  setAmount,
  frequency,
  setFrequency,
  sipDate,
  setSipDate,
  tenure,
  setTenure,
  mandateId,
  setMandateId,
  mandates,
}: {
  amount: number;
  setAmount: (n: number) => void;
  frequency: "monthly" | "quarterly";
  setFrequency: (f: "monthly" | "quarterly") => void;
  sipDate: number;
  setSipDate: (d: number) => void;
  tenure: string;
  setTenure: (t: string) => void;
  mandateId: string;
  setMandateId: (id: string) => void;
  mandates: Array<{ id: string; bank: string; maxAmount: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>SIP amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <AmountChips values={[1000, 2500, 5000, 10000, 25000]} onPick={setAmount} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as "monthly" | "quarterly")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>SIP date</Label>
          <Select value={sipDate.toString()} onValueChange={(v) => setSipDate(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 7, 10, 15, 20, 25, 28].map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tenure</Label>
          <Select value={tenure} onValueChange={setTenure}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Pick mandate" />
            </SelectTrigger>
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

function SwitchFields({
  units,
  setUnits,
  switchAll,
  setSwitchAll,
  switchTargetCode,
  setSwitchTargetCode,
  excludeCode,
  sourceHolding,
}: {
  units: number;
  setUnits: (n: number) => void;
  switchAll: boolean;
  setSwitchAll: (b: boolean) => void;
  switchTargetCode: string;
  setSwitchTargetCode: (s: string) => void;
  excludeCode: string;
  sourceHolding?: { units: number };
}) {
  const { data: schemes } = useSchemesQuery("");
  return (
    <div className="space-y-3">
      {sourceHolding && (
        <p className="text-xs text-muted-foreground">
          Available to switch:{" "}
          <strong className="tabular-nums text-foreground">{sourceHolding.units.toFixed(3)}</strong>{" "}
          units
        </p>
      )}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={switchAll} onCheckedChange={(v) => setSwitchAll(!!v)} /> Switch all units
      </label>
      {!switchAll && (
        <div className="space-y-1.5">
          <Label>Units</Label>
          <Input
            type="number"
            step="0.001"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Target scheme</Label>
        <Select value={switchTargetCode} onValueChange={setSwitchTargetCode}>
          <SelectTrigger>
            <SelectValue placeholder="Pick scheme" />
          </SelectTrigger>
          <SelectContent>
            {(schemes ?? [])
              .filter((s) => s.code !== excludeCode)
              .map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function RedeemFields({
  scheme,
  amount,
  setAmount,
  redeemAll,
  setRedeemAll,
  payoutBank,
  setPayoutBank,
  sourceHolding,
}: {
  scheme: SchemeLite;
  amount: number;
  setAmount: (n: number) => void;
  redeemAll: boolean;
  setRedeemAll: (b: boolean) => void;
  payoutBank: string;
  setPayoutBank: (s: string) => void;
  sourceHolding?: { units: number; invested: number };
}) {
  return (
    <div className="space-y-3">
      {sourceHolding && (
        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs">
          <p className="text-muted-foreground">Current holding</p>
          <p className="font-semibold">
            {sourceHolding.units.toFixed(3)} units · {formatINR(sourceHolding.invested)} invested
          </p>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={redeemAll} onCheckedChange={(v) => setRedeemAll(!!v)} /> Redeem all units
      </label>
      {!redeemAll && (
        <div className="space-y-1.5">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Payout bank</Label>
        <Input value={payoutBank} onChange={(e) => setPayoutBank(e.target.value)} />
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-info">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Funds typically credit T+1 (equity) or T+0 (liquid).{" "}
          {scheme.exitLoadDays > 0 && `Exit load applies for first ${scheme.exitLoadDays} days.`}
        </span>
      </div>
    </div>
  );
}

function StpFields({
  amount,
  setAmount,
  frequency,
  setFrequency,
  transferDay,
  setTransferDay,
  installments,
  setInstallments,
  switchTargetCode,
  setSwitchTargetCode,
  excludeCode,
}: {
  amount: number;
  setAmount: (n: number) => void;
  frequency: "monthly" | "quarterly";
  setFrequency: (f: "monthly" | "quarterly") => void;
  transferDay: number;
  setTransferDay: (d: number) => void;
  installments: string;
  setInstallments: (s: string) => void;
  switchTargetCode: string;
  setSwitchTargetCode: (s: string) => void;
  excludeCode: string;
}) {
  const { data: schemes } = useSchemesQuery("");
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Systematically transfer a fixed amount from this scheme to another at chosen intervals.
      </p>
      <div className="space-y-1.5">
        <Label>Transfer amount per installment</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <AmountChips values={[1000, 5000, 10000, 25000]} onPick={setAmount} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as "monthly" | "quarterly")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Transfer day</Label>
          <Select
            value={transferDay.toString()}
            onValueChange={(v) => setTransferDay(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Installments</Label>
          <Select value={installments} onValueChange={setInstallments}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="36">36</SelectItem>
              <SelectItem value="perpetual">Perpetual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Target scheme</Label>
        <Select value={switchTargetCode} onValueChange={setSwitchTargetCode}>
          <SelectTrigger>
            <SelectValue placeholder="Pick scheme" />
          </SelectTrigger>
          <SelectContent>
            {(schemes ?? [])
              .filter((s) => s.code !== excludeCode)
              .map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SwpFields({
  amount,
  setAmount,
  frequency,
  setFrequency,
  transferDay,
  setTransferDay,
  installments,
  setInstallments,
  payoutBank,
  setPayoutBank,
}: {
  amount: number;
  setAmount: (n: number) => void;
  frequency: "monthly" | "quarterly";
  setFrequency: (f: "monthly" | "quarterly") => void;
  transferDay: number;
  setTransferDay: (d: number) => void;
  installments: string;
  setInstallments: (s: string) => void;
  payoutBank: string;
  setPayoutBank: (s: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Withdraw a fixed amount to the investor's bank at chosen intervals.
      </p>
      <div className="space-y-1.5">
        <Label>Withdrawal amount per installment</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <AmountChips values={[1000, 5000, 10000, 25000]} onPick={setAmount} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as "monthly" | "quarterly")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Transfer day</Label>
          <Select
            value={transferDay.toString()}
            onValueChange={(v) => setTransferDay(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Installments</Label>
          <Select value={installments} onValueChange={setInstallments}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="36">36</SelectItem>
              <SelectItem value="perpetual">Perpetual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Payout bank</Label>
        <Input value={payoutBank} onChange={(e) => setPayoutBank(e.target.value)} />
      </div>
    </div>
  );
}
