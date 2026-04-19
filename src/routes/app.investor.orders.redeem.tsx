import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, ArrowRight, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { HoldingPicker } from "@/features/orders/components/holding-picker";
import { OrderSuccess } from "@/features/orders/components/order-success";
import { useHoldingsQuery } from "@/features/portfolio/api";
import { useKycOverviewQuery } from "@/features/kyc/api";
import { useExecuteRedeemMutation } from "@/features/orders/api";
import { redeemDetailsStepSchema } from "@/features/orders/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderConfirmation } from "@/types/orders";
import type { Holding } from "@/types/portfolio";

const searchSchema = z.object({
  holdingId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/app/investor/orders/redeem")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Redeem — WealthOS" }] }),
  component: RedeemWizard,
});

const STEPS = [
  { id: "holding", label: "Pick holding" },
  { id: "details", label: "Units or amount" },
  { id: "review", label: "Review & confirm" },
];

interface DetailsForm {
  mode: "amount" | "units" | "all";
  amount?: number;
  units?: number;
  bankAccountId: string;
  maxAmount: number;
  maxUnits: number;
}

function RedeemWizard() {
  const { holdingId: initialHoldingId } = Route.useSearch();
  const { data: holdings, isLoading: holdingsLoading } = useHoldingsQuery();
  const { data: kyc, isLoading: kycLoading } = useKycOverviewQuery();
  const mutation = useExecuteRedeemMutation();

  const [step, setStep] = useState(0);
  const [holdingId, setHoldingId] = useState<string | undefined>(initialHoldingId);
  const [detailValues, setDetailValues] = useState<DetailsForm | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const selected = holdings?.find((h) => h.id === holdingId);

  const form = useForm<DetailsForm>({
    resolver: zodResolver(redeemDetailsStepSchema),
    defaultValues: {
      mode: "all",
      amount: undefined,
      units: undefined,
      bankAccountId: "",
      maxAmount: 1,
      maxUnits: 1,
    },
    values: detailValues ?? undefined,
  });

  // Keep maxAmount/maxUnits sentinels in sync with the selected holding.
  useEffect(() => {
    if (selected) {
      form.setValue("maxAmount", selected.currentValue);
      form.setValue("maxUnits", selected.units);
    }
  }, [selected, form]);

  const mode = form.watch("mode");
  const amount = form.watch("amount");
  const units = form.watch("units");

  if (confirmation) {
    return (
      <>
        <PageHeader eyebrow="Redemption submitted" title="Confirmation" description="Your redemption is being processed." />
        <div className="px-6 py-6 sm:px-8">
          <OrderSuccess
            confirmation={confirmation}
            onPlaceAnother={() => {
              setConfirmation(null);
              setStep(0);
              setHoldingId(undefined);
              setDetailValues(null);
              form.reset();
            }}
          />
        </div>
      </>
    );
  }

  function goNextFromHolding() {
    if (!holdingId) {
      toast.error("Pick a holding to redeem.");
      return;
    }
    setStep(1);
  }

  async function submitDetails(values: DetailsForm) {
    setDetailValues(values);
    setStep(2);
  }

  async function placeRedemption() {
    if (!holdingId || !detailValues) return;
    try {
      const result = await mutation.mutateAsync({
        holdingId,
        mode: detailValues.mode,
        amount: detailValues.mode === "amount" ? detailValues.amount : undefined,
        units: detailValues.mode === "units" ? detailValues.units : undefined,
        bankAccountId: detailValues.bankAccountId,
      });
      setConfirmation(result);
      toast.success("Redemption order accepted.");
    } catch {
      toast.error("Redemption failed. Please retry.");
    }
  }

  // Computed proceeds preview
  const proceedsPreview =
    !selected
      ? 0
      : mode === "all"
        ? selected.currentValue
        : mode === "amount"
          ? amount ?? 0
          : (units ?? 0) * selected.currentNav;

  const showExitLoadWarning = selected ? isWithinExitLoadWindow(selected) : false;

  return (
    <>
      <PageHeader
        eyebrow="Withdraw"
        title="Redeem units"
        description="Withdraw all or part of any holding back to your bank account."
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <WizardStepper steps={STEPS} current={step} />
          </CardContent>
        </Card>

        {step === 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Pick a holding</CardTitle>
              <CardDescription>Search across your current positions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              {holdingsLoading || !holdings ? (
                <Skeleton className="h-[420px] rounded-lg" />
              ) : (
                <HoldingPicker holdings={holdings} selectedId={holdingId} onSelect={setHoldingId} />
              )}
              <div className="flex justify-end">
                <Button onClick={goNextFromHolding} disabled={!holdingId} className="gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && selected && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>How much would you like to redeem?</CardTitle>
              <CardDescription>
                From <span className="font-semibold text-foreground">{selected.schemeName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <SourceSummary holding={selected} />

              {showExitLoadWarning && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-xs text-muted-foreground">
                    Some units in this holding may be subject to a{" "}
                    <span className="font-semibold text-foreground">1% exit load</span> for redemption within 1 year.
                    Short-term capital gains tax may also apply.
                  </p>
                </div>
              )}

              <form onSubmit={form.handleSubmit(submitDetails)} className="space-y-6">
                <div className="space-y-3">
                  <Label>Redemption mode</Label>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => form.setValue("mode", v as "amount" | "units" | "all", { shouldValidate: true })}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {(["all", "amount", "units"] as const).map((m) => (
                      <label
                        key={m}
                        htmlFor={`mode-${m}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          mode === m
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <RadioGroupItem value={m} id={`mode-${m}`} />
                        <span className="text-sm font-medium">
                          {m === "all" ? "Full redemption" : m === "amount" ? "By amount" : "By units"}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {mode === "amount" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount (INR)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="100"
                        min={100}
                        max={selected.currentValue}
                        className="pl-7 text-base font-semibold tabular-nums sm:max-w-[280px]"
                        {...form.register("amount", { valueAsNumber: true })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: <span className="font-semibold text-foreground">{formatINR(selected.currentValue)}</span>
                    </p>
                    {form.formState.errors.amount && (
                      <p className="text-xs font-medium text-destructive">{form.formState.errors.amount.message}</p>
                    )}
                  </div>
                )}

                {mode === "units" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      step="0.001"
                      min={0.001}
                      max={selected.units}
                      className="text-base font-semibold tabular-nums sm:max-w-[280px]"
                      {...form.register("units", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      You hold:{" "}
                      <span className="font-semibold text-foreground">
                        {selected.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                      </span>{" "}
                      units · NAV ₹{selected.currentNav.toFixed(2)}
                    </p>
                    {form.formState.errors.units && (
                      <p className="text-xs font-medium text-destructive">{form.formState.errors.units.message}</p>
                    )}
                  </div>
                )}

                {proceedsPreview > 0 && (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Estimated proceeds
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatINR(proceedsPreview)}</p>
                    <p className="text-xs text-muted-foreground">Final amount depends on the next applicable NAV.</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Credit to</Label>
                  {kycLoading || !kyc ? (
                    <Skeleton className="h-20 rounded-lg" />
                  ) : (
                    <RadioGroup
                      value={form.watch("bankAccountId")}
                      onValueChange={(v) => form.setValue("bankAccountId", v, { shouldValidate: true })}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {kyc.bankAccounts.map((b) => (
                        <label
                          key={b.id}
                          htmlFor={`bank-${b.id}`}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                            form.watch("bankAccountId") === b.id
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-foreground/20",
                          )}
                        >
                          <RadioGroupItem value={b.id} id={`bank-${b.id}`} className="mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <p className="font-semibold">{b.bankName}</p>
                              {b.isPrimary && (
                                <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {b.accountNumberMasked} · {b.ifsc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                  {form.formState.errors.bankAccountId && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.bankAccountId.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="gap-1.5">
                    Review redemption <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && detailValues && selected && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Review & confirm</CardTitle>
              <CardDescription>Funds will be credited to your bank account on T+3.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="rounded-xl border border-border bg-secondary/40 p-5">
                <div className="grid gap-y-4 sm:grid-cols-2">
                  <ReviewRow label="From scheme" value={selected.schemeName} />
                  <ReviewRow label="AMC" value={`${selected.amc} · ${selected.category}`} />
                  <ReviewRow
                    label="Mode"
                    value={
                      detailValues.mode === "all"
                        ? "Full redemption"
                        : detailValues.mode === "amount"
                          ? "By amount"
                          : "By units"
                    }
                  />
                  <ReviewRow
                    label={detailValues.mode === "units" ? "Units" : "Estimated proceeds"}
                    value={
                      detailValues.mode === "units"
                        ? String(detailValues.units ?? 0)
                        : formatINR(proceedsPreview)
                    }
                    accent
                  />
                  <ReviewRow
                    label="Credit to"
                    value={kyc?.bankAccounts.find((b) => b.id === detailValues.bankAccountId)?.bankName ?? "—"}
                  />
                  <ReviewRow label="Settlement" value="T+3 business days" />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <p className="text-xs text-muted-foreground">
                  Cut-off for same-day NAV is{" "}
                  <span className="font-semibold text-foreground">3:00 PM IST</span> for equity schemes. Redemption
                  proceeds are typically credited within 3 business days.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={mutation.isPending}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={placeRedemption} disabled={mutation.isPending} className="gap-1.5">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>Confirm redemption</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function SourceSummary({ holding }: { holding: Holding }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
      <Stat label="Current value" value={formatINR(holding.currentValue)} accent />
      <Stat label="Units" value={holding.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })} />
      <Stat label="NAV" value={`₹${holding.currentNav.toFixed(2)}`} />
      <Stat label="Avg cost" value={`₹${holding.avgNav.toFixed(2)}`} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", accent && "font-display text-lg")}>{value}</p>
    </div>
  );
}

function ReviewRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", accent && "font-display text-xl")}>{value}</p>
    </div>
  );
}

/**
 * Heuristic: equity holdings less than ~365 days from inception likely have
 * exit-load exposure. Mock — without per-lot acquisition dates we approximate
 * via the navAsOf vs a synthetic acquisition window.
 */
function isWithinExitLoadWindow(h: Holding): boolean {
  return h.assetClass === "equity" && h.returnPct < 35; // surface warning broadly in mock mode
}
