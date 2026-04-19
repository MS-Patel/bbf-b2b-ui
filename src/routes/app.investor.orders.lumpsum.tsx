import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CreditCard, Loader2, ShieldCheck } from "lucide-react";
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
import { SchemePicker } from "@/features/orders/components/scheme-picker";
import { OrderSuccess } from "@/features/orders/components/order-success";
import { useSchemesQuery } from "@/features/schemes/api";
import { useKycOverviewQuery } from "@/features/kyc/api";
import { useExecuteLumpsumMutation } from "@/features/orders/api";
import { lumpsumAmountStepSchema } from "@/features/orders/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderConfirmation } from "@/types/orders";

const searchSchema = z.object({
  schemeId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/app/investor/orders/lumpsum")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Lumpsum Purchase — WealthOS" }] }),
  component: LumpsumWizard,
});

const STEPS = [
  { id: "scheme", label: "Choose scheme" },
  { id: "amount", label: "Amount & bank" },
  { id: "review", label: "Review & confirm" },
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

interface AmountForm {
  amount: number;
  bankAccountId: string;
  folioMode: "new" | "existing";
  folioNumber?: string;
}

function LumpsumWizard() {
  const { schemeId: initialSchemeId } = Route.useSearch();
  const { data: schemes, isLoading: schemesLoading } = useSchemesQuery();
  const { data: kyc, isLoading: kycLoading } = useKycOverviewQuery();
  const mutation = useExecuteLumpsumMutation();

  const [step, setStep] = useState(0);
  const [schemeId, setSchemeId] = useState<string | undefined>(initialSchemeId);
  const [amountValues, setAmountValues] = useState<AmountForm | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const selectedScheme = schemes?.find((s) => s.id === schemeId);

  const form = useForm<AmountForm>({
    resolver: zodResolver(lumpsumAmountStepSchema),
    defaultValues: {
      amount: 10000,
      bankAccountId: "",
      folioMode: "new",
      folioNumber: "",
    },
    values: amountValues ?? undefined,
  });
  const folioMode = form.watch("folioMode");
  const amountValue = form.watch("amount");

  if (confirmation) {
    return (
      <>
        <PageHeader eyebrow="Order placed" title="Confirmation" description="Your lumpsum order is on its way to BSE Star MF." />
        <div className="px-6 py-6 sm:px-8">
          <OrderSuccess
            confirmation={confirmation}
            onPlaceAnother={() => {
              setConfirmation(null);
              setStep(0);
              setSchemeId(undefined);
              setAmountValues(null);
              form.reset();
            }}
          />
        </div>
      </>
    );
  }

  function goNextFromScheme() {
    if (!schemeId) {
      toast.error("Please pick a scheme to continue.");
      return;
    }
    setStep(1);
  }

  async function submitAmount(values: AmountForm) {
    if (selectedScheme && values.amount < selectedScheme.minLumpsum) {
      form.setError("amount", {
        message: `Minimum for this scheme is ₹${selectedScheme.minLumpsum.toLocaleString("en-IN")}.`,
      });
      return;
    }
    setAmountValues(values);
    setStep(2);
  }

  async function placeOrder() {
    if (!schemeId || !amountValues) return;
    try {
      const result = await mutation.mutateAsync({
        schemeId,
        amount: amountValues.amount,
        bankAccountId: amountValues.bankAccountId,
        folioMode: amountValues.folioMode,
        folioNumber: amountValues.folioNumber,
      });
      setConfirmation(result);
      toast.success("Order accepted by BSE Star MF.");
    } catch (e) {
      toast.error("Order failed. Please retry.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Buy"
        title="Lumpsum Purchase"
        description="Place a one-time investment in any BSE Star MF scheme."
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
              <CardTitle>Pick a scheme</CardTitle>
              <CardDescription>Search across the BSE Star MF universe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              {schemesLoading || !schemes ? (
                <Skeleton className="h-[420px] rounded-lg" />
              ) : (
                <SchemePicker schemes={schemes} selectedId={schemeId} onSelect={setSchemeId} />
              )}
              <div className="flex justify-end">
                <Button onClick={goNextFromScheme} disabled={!schemeId} className="gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Investment details</CardTitle>
              <CardDescription>
                Investing in <span className="font-semibold text-foreground">{selectedScheme?.schemeName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <form onSubmit={form.handleSubmit(submitAmount)} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="amount">Amount (INR)</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="100"
                      min={selectedScheme?.minLumpsum ?? 100}
                      className="pl-7 text-base font-semibold tabular-nums"
                      {...form.register("amount", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => form.setValue("amount", q, { shouldValidate: true })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          amountValue === q
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        {formatINR(q)}
                      </button>
                    ))}
                  </div>
                  {selectedScheme && (
                    <p className="text-xs text-muted-foreground">
                      Minimum lumpsum for this scheme: <span className="font-semibold text-foreground">{formatINR(selectedScheme.minLumpsum)}</span>
                    </p>
                  )}
                  {form.formState.errors.amount && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Pay from</Label>
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
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.bankAccountId.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Folio</Label>
                  <RadioGroup
                    value={folioMode}
                    onValueChange={(v) => form.setValue("folioMode", v as "new" | "existing", { shouldValidate: true })}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {(["new", "existing"] as const).map((m) => (
                      <label
                        key={m}
                        htmlFor={`folio-${m}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          folioMode === m
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <RadioGroupItem value={m} id={`folio-${m}`} />
                        <span className="text-sm font-medium">
                          {m === "new" ? "Create a new folio" : "Use existing folio"}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  {folioMode === "existing" && (
                    <div className="space-y-1.5">
                      <Input
                        placeholder="Existing folio number"
                        {...form.register("folioNumber")}
                      />
                      {form.formState.errors.folioNumber && (
                        <p className="text-xs font-medium text-destructive">
                          {form.formState.errors.folioNumber.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="gap-1.5">
                    Review order <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && amountValues && selectedScheme && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Review & confirm</CardTitle>
              <CardDescription>Once placed, the order will be processed at the next applicable NAV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="rounded-xl border border-border bg-secondary/40 p-5">
                <div className="grid gap-y-4 sm:grid-cols-2">
                  <ReviewRow label="Scheme" value={selectedScheme.schemeName} />
                  <ReviewRow label="AMC" value={`${selectedScheme.amc} · ${selectedScheme.category}`} />
                  <ReviewRow label="Amount" value={formatINR(amountValues.amount)} accent />
                  <ReviewRow label="Current NAV" value={`₹${selectedScheme.nav.toFixed(2)}`} />
                  <ReviewRow
                    label="Bank account"
                    value={
                      kyc?.bankAccounts.find((b) => b.id === amountValues.bankAccountId)?.bankName ?? "—"
                    }
                  />
                  <ReviewRow
                    label="Folio"
                    value={amountValues.folioMode === "new" ? "New folio" : `Existing — ${amountValues.folioNumber ?? ""}`}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <p className="text-xs text-muted-foreground">
                  Orders placed before <span className="font-semibold text-foreground">2:30 PM IST</span> on a business day are
                  processed at the same day's NAV. After cut-off or on holidays, the next business day's NAV applies.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={mutation.isPending} className="gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={placeOrder} disabled={mutation.isPending} className="gap-1.5">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    <>Confirm & pay {formatINR(amountValues.amount)}</>
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

function ReviewRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", accent && "font-display text-xl")}>{value}</p>
    </div>
  );
}
