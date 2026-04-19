import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  CreditCard,
  Infinity as InfinityIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { SchemePicker } from "@/features/orders/components/scheme-picker";
import { OrderSuccess } from "@/features/orders/components/order-success";
import { useSchemesQuery } from "@/features/schemes/api";
import { useKycOverviewQuery } from "@/features/kyc/api";
import { useExecuteSipMutation } from "@/features/orders/api";
import { sipDetailsStepSchema } from "@/features/orders/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderConfirmation } from "@/types/orders";

const searchSchema = z.object({
  schemeId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/app/investor/orders/sip")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Start a SIP — WealthOS" }] }),
  component: SipWizard,
});

const STEPS = [
  { id: "scheme", label: "Choose scheme" },
  { id: "details", label: "SIP details" },
  { id: "review", label: "Review & confirm" },
];

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

interface DetailsForm {
  monthlyAmount: number;
  frequency: "monthly" | "quarterly";
  startDate: Date;
  perpetual: boolean;
  tenureMonths?: number;
  bankAccountId: string;
  folioMode: "new" | "existing";
  folioNumber?: string;
}

function defaultStartDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 7);
  return d;
}

function SipWizard() {
  const { schemeId: initialSchemeId } = Route.useSearch();
  const { data: schemes, isLoading: schemesLoading } = useSchemesQuery();
  const { data: kyc, isLoading: kycLoading } = useKycOverviewQuery();
  const mutation = useExecuteSipMutation();

  const [step, setStep] = useState(0);
  const [schemeId, setSchemeId] = useState<string | undefined>(initialSchemeId);
  const [detailValues, setDetailValues] = useState<DetailsForm | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const selectedScheme = schemes?.find((s) => s.id === schemeId);

  const form = useForm<DetailsForm>({
    resolver: zodResolver(sipDetailsStepSchema),
    defaultValues: {
      monthlyAmount: 5000,
      frequency: "monthly",
      startDate: defaultStartDate(),
      perpetual: true,
      tenureMonths: 60,
      bankAccountId: "",
      folioMode: "new",
      folioNumber: "",
    },
    values: detailValues ?? undefined,
  });

  const folioMode = form.watch("folioMode");
  const perpetual = form.watch("perpetual");
  const monthlyAmount = form.watch("monthlyAmount");
  const tenureMonths = form.watch("tenureMonths");

  if (confirmation) {
    return (
      <>
        <PageHeader eyebrow="SIP registered" title="Confirmation" description="Your SIP is set up and ready to run." />
        <div className="px-6 py-6 sm:px-8">
          <OrderSuccess
            confirmation={confirmation}
            onPlaceAnother={() => {
              setConfirmation(null);
              setStep(0);
              setSchemeId(undefined);
              setDetailValues(null);
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

  async function submitDetails(values: DetailsForm) {
    if (selectedScheme && values.monthlyAmount < selectedScheme.minSip) {
      form.setError("monthlyAmount", {
        message: `Minimum SIP for this scheme is ₹${selectedScheme.minSip.toLocaleString("en-IN")}.`,
      });
      return;
    }
    setDetailValues(values);
    setStep(2);
  }

  async function placeSip() {
    if (!schemeId || !detailValues) return;
    try {
      const result = await mutation.mutateAsync({
        schemeId,
        monthlyAmount: detailValues.monthlyAmount,
        frequency: detailValues.frequency,
        startDate: detailValues.startDate.toISOString(),
        tenureMonths: detailValues.perpetual ? null : detailValues.tenureMonths ?? null,
        bankAccountId: detailValues.bankAccountId,
        folioMode: detailValues.folioMode,
        folioNumber: detailValues.folioNumber,
      });
      setConfirmation(result);
      toast.success("SIP mandate registered.");
    } catch {
      toast.error("SIP setup failed. Please retry.");
    }
  }

  const totalProjected =
    !detailValues
      ? 0
      : detailValues.perpetual
        ? 0
        : detailValues.monthlyAmount * (detailValues.tenureMonths ?? 0);

  return (
    <>
      <PageHeader
        eyebrow="Invest"
        title="Start a SIP"
        description="Automate your investments with a Systematic Investment Plan."
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
              <CardDescription>SIPs work best with equity & hybrid funds.</CardDescription>
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
              <CardTitle>SIP details</CardTitle>
              <CardDescription>
                SIP for <span className="font-semibold text-foreground">{selectedScheme?.schemeName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <form onSubmit={form.handleSubmit(submitDetails)} className="space-y-6">
                {/* Amount */}
                <div className="space-y-3">
                  <Label htmlFor="monthlyAmount">Installment amount (INR)</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="monthlyAmount"
                      type="number"
                      step="100"
                      min={selectedScheme?.minSip ?? 500}
                      className="pl-7 text-base font-semibold tabular-nums"
                      {...form.register("monthlyAmount", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => form.setValue("monthlyAmount", q, { shouldValidate: true })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          monthlyAmount === q
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
                      Minimum SIP for this scheme:{" "}
                      <span className="font-semibold text-foreground">{formatINR(selectedScheme.minSip)}</span>
                    </p>
                  )}
                  {form.formState.errors.monthlyAmount && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.monthlyAmount.message}
                    </p>
                  )}
                </div>

                {/* Frequency */}
                <div className="space-y-3">
                  <Label>Frequency</Label>
                  <RadioGroup
                    value={form.watch("frequency")}
                    onValueChange={(v) => form.setValue("frequency", v as "monthly" | "quarterly")}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {(["monthly", "quarterly"] as const).map((f) => (
                      <label
                        key={f}
                        htmlFor={`freq-${f}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          form.watch("frequency") === f
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <RadioGroupItem value={f} id={`freq-${f}`} />
                        <span className="text-sm font-medium capitalize">{f}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Start date */}
                <div className="space-y-3">
                  <Label>Start date</Label>
                  <Controller
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            className={cn(
                              "w-full justify-start gap-2 text-left font-normal sm:w-[280px]",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(d) => d && field.onChange(d)}
                            disabled={(date) => {
                              const min = new Date();
                              min.setHours(0, 0, 0, 0);
                              min.setDate(min.getDate() + 5);
                              return date < min;
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    NACH mandate registration takes ~5 business days. First debit can be scheduled from then.
                  </p>
                  {form.formState.errors.startDate && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>

                {/* Tenure */}
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <InfinityIcon className="h-4 w-4 text-muted-foreground" /> Perpetual SIP
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Run until you stop it manually. Recommended for goal-agnostic wealth building.
                      </p>
                    </div>
                    <Switch
                      checked={perpetual}
                      onCheckedChange={(v) => form.setValue("perpetual", v, { shouldValidate: true })}
                    />
                  </div>

                  {!perpetual && (
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="tenureMonths">Tenure (months)</Label>
                      <Input
                        id="tenureMonths"
                        type="number"
                        min={6}
                        max={360}
                        step={6}
                        className="tabular-nums sm:max-w-[180px]"
                        {...form.register("tenureMonths", { valueAsNumber: true })}
                      />
                      {tenureMonths != null && tenureMonths > 0 && monthlyAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total committed:{" "}
                          <span className="font-semibold text-foreground">
                            {formatINR(monthlyAmount * tenureMonths)}
                          </span>{" "}
                          over {tenureMonths} months
                        </p>
                      )}
                      {form.formState.errors.tenureMonths && (
                        <p className="text-xs font-medium text-destructive">
                          {form.formState.errors.tenureMonths.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bank account */}
                <div className="space-y-3">
                  <Label>NACH from</Label>
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

                {/* Folio */}
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
                      <Input placeholder="Existing folio number" {...form.register("folioNumber")} />
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
                    Review SIP <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && detailValues && selectedScheme && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Review your SIP</CardTitle>
              <CardDescription>
                Confirm the details below to register the NACH mandate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="rounded-xl border border-border bg-secondary/40 p-5">
                <div className="grid gap-y-4 sm:grid-cols-2">
                  <ReviewRow label="Scheme" value={selectedScheme.schemeName} />
                  <ReviewRow label="AMC" value={`${selectedScheme.amc} · ${selectedScheme.category}`} />
                  <ReviewRow
                    label="Installment"
                    value={formatINR(detailValues.monthlyAmount)}
                    accent
                  />
                  <ReviewRow label="Frequency" value={detailValues.frequency} className="capitalize" />
                  <ReviewRow label="Start date" value={format(detailValues.startDate, "PPP")} />
                  <ReviewRow
                    label="Tenure"
                    value={detailValues.perpetual ? "Perpetual" : `${detailValues.tenureMonths} months`}
                  />
                  <ReviewRow
                    label="Bank"
                    value={
                      kyc?.bankAccounts.find((b) => b.id === detailValues.bankAccountId)?.bankName ?? "—"
                    }
                  />
                  <ReviewRow
                    label="Folio"
                    value={detailValues.folioMode === "new" ? "New folio" : `Existing — ${detailValues.folioNumber ?? ""}`}
                  />
                  {totalProjected > 0 && (
                    <div className="sm:col-span-2 mt-1 rounded-lg border border-accent/20 bg-accent/5 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                        Total commitment
                      </p>
                      <p className="mt-1 font-display text-xl font-bold tabular-nums">{formatINR(totalProjected)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <p className="text-xs text-muted-foreground">
                  By confirming, you authorize WealthOS to debit your bank account for the installment amount on the
                  scheduled date. You can pause or cancel the SIP anytime.
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
                <Button type="button" onClick={placeSip} disabled={mutation.isPending} className="gap-1.5">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering mandate…
                    </>
                  ) : (
                    <>Confirm SIP — {formatINR(detailValues.monthlyAmount)}/mo</>
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

function ReviewRow({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-semibold", accent && "font-display text-xl", className)}>{value}</p>
    </div>
  );
}
