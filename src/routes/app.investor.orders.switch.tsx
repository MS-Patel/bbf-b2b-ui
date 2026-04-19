import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Repeat2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { HoldingPicker } from "@/features/orders/components/holding-picker";
import { SchemePicker } from "@/features/orders/components/scheme-picker";
import { OrderSuccess } from "@/features/orders/components/order-success";
import { useHoldingsQuery } from "@/features/portfolio/api";
import { useSchemesQuery } from "@/features/schemes/api";
import { useExecuteSwitchMutation } from "@/features/orders/api";
import { switchDetailsStepSchema } from "@/features/orders/schemas";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderConfirmation } from "@/types/orders";
import type { Holding } from "@/types/portfolio";

const searchSchema = z.object({
  fromHoldingId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/app/investor/orders/switch")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "investor") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Switch funds — WealthOS" }] }),
  component: SwitchWizard,
});

const STEPS = [
  { id: "from", label: "From scheme" },
  { id: "to", label: "Destination & amount" },
  { id: "review", label: "Review & confirm" },
];

interface DetailsForm {
  toSchemeId: string;
  mode: "amount" | "units" | "all";
  amount?: number;
  units?: number;
  folioMode: "new" | "existing";
  folioNumber?: string;
  maxAmount: number;
  maxUnits: number;
}

function SwitchWizard() {
  const { fromHoldingId: initialId } = Route.useSearch();
  const { data: holdings, isLoading: holdingsLoading } = useHoldingsQuery();
  const { data: schemes, isLoading: schemesLoading } = useSchemesQuery();
  const mutation = useExecuteSwitchMutation();

  const [step, setStep] = useState(0);
  const [fromHoldingId, setFromHoldingId] = useState<string | undefined>(initialId);
  const [detailValues, setDetailValues] = useState<DetailsForm | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const fromHolding = holdings?.find((h) => h.id === fromHoldingId);

  const form = useForm<DetailsForm>({
    resolver: zodResolver(switchDetailsStepSchema),
    defaultValues: {
      toSchemeId: "",
      mode: "all",
      amount: undefined,
      units: undefined,
      folioMode: "new",
      folioNumber: "",
      maxAmount: 1,
      maxUnits: 1,
    },
    values: detailValues ?? undefined,
  });

  useEffect(() => {
    if (fromHolding) {
      form.setValue("maxAmount", fromHolding.currentValue);
      form.setValue("maxUnits", fromHolding.units);
    }
  }, [fromHolding, form]);

  const mode = form.watch("mode");
  const toSchemeId = form.watch("toSchemeId");
  const folioMode = form.watch("folioMode");
  const amount = form.watch("amount");
  const units = form.watch("units");

  const toScheme = schemes?.find((s) => s.id === toSchemeId);

  // Filter destination schemes — same AMC, exclude source scheme
  const destinationSchemes = schemes?.filter(
    (s) => fromHolding && s.amc === fromHolding.amc && s.schemeCode !== fromHolding.schemeCode,
  );

  if (confirmation) {
    return (
      <>
        <PageHeader eyebrow="Switch submitted" title="Confirmation" description="Your switch is being processed." />
        <div className="px-6 py-6 sm:px-8">
          <OrderSuccess
            confirmation={confirmation}
            onPlaceAnother={() => {
              setConfirmation(null);
              setStep(0);
              setFromHoldingId(undefined);
              setDetailValues(null);
              form.reset();
            }}
          />
        </div>
      </>
    );
  }

  function goNextFromHolding() {
    if (!fromHoldingId) {
      toast.error("Pick a source holding to continue.");
      return;
    }
    setStep(1);
  }

  async function submitDetails(values: DetailsForm) {
    setDetailValues(values);
    setStep(2);
  }

  async function placeSwitch() {
    if (!fromHoldingId || !detailValues) return;
    try {
      const result = await mutation.mutateAsync({
        fromHoldingId,
        toSchemeId: detailValues.toSchemeId,
        mode: detailValues.mode,
        amount: detailValues.mode === "amount" ? detailValues.amount : undefined,
        units: detailValues.mode === "units" ? detailValues.units : undefined,
        folioMode: detailValues.folioMode,
        folioNumber: detailValues.folioNumber,
      });
      setConfirmation(result);
      toast.success("Switch order accepted.");
    } catch {
      toast.error("Switch failed. Please retry.");
    }
  }

  const switchAmountPreview =
    !fromHolding
      ? 0
      : mode === "all"
        ? fromHolding.currentValue
        : mode === "amount"
          ? amount ?? 0
          : (units ?? 0) * fromHolding.currentNav;

  return (
    <>
      <PageHeader
        eyebrow="Reallocate"
        title="Switch between funds"
        description="Move units from one scheme to another within the same AMC, tax-efficiently."
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
              <CardTitle>Pick the source holding</CardTitle>
              <CardDescription>Switches happen within the same AMC.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              {holdingsLoading || !holdings ? (
                <Skeleton className="h-[420px] rounded-lg" />
              ) : (
                <HoldingPicker holdings={holdings} selectedId={fromHoldingId} onSelect={setFromHoldingId} />
              )}
              <div className="flex justify-end">
                <Button onClick={goNextFromHolding} disabled={!fromHoldingId} className="gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && fromHolding && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Where to switch</CardTitle>
              <CardDescription>
                From <span className="font-semibold text-foreground">{fromHolding.schemeName}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <SourceSummary holding={fromHolding} />

              <form onSubmit={form.handleSubmit(submitDetails)} className="space-y-6">
                {/* Destination scheme */}
                <div className="space-y-3">
                  <Label>Destination scheme — {fromHolding.amc}</Label>
                  {schemesLoading || !destinationSchemes ? (
                    <Skeleton className="h-[260px] rounded-lg" />
                  ) : destinationSchemes.length === 0 ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-muted-foreground">
                      No other schemes available from {fromHolding.amc}. Choose a different source holding to switch.
                    </div>
                  ) : (
                    <SchemePicker
                      schemes={destinationSchemes}
                      selectedId={toSchemeId || undefined}
                      onSelect={(id) => form.setValue("toSchemeId", id, { shouldValidate: true })}
                    />
                  )}
                  {form.formState.errors.toSchemeId && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.toSchemeId.message}
                    </p>
                  )}
                </div>

                {/* Amount/Units mode */}
                <div className="space-y-3">
                  <Label>Switch mode</Label>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => form.setValue("mode", v as "amount" | "units" | "all", { shouldValidate: true })}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {(["all", "amount", "units"] as const).map((m) => (
                      <label
                        key={m}
                        htmlFor={`smode-${m}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          mode === m
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <RadioGroupItem value={m} id={`smode-${m}`} />
                        <span className="text-sm font-medium">
                          {m === "all" ? "Switch everything" : m === "amount" ? "By amount" : "By units"}
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
                        max={fromHolding.currentValue}
                        className="pl-7 text-base font-semibold tabular-nums sm:max-w-[280px]"
                        {...form.register("amount", { valueAsNumber: true })}
                      />
                    </div>
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
                      max={fromHolding.units}
                      className="text-base font-semibold tabular-nums sm:max-w-[280px]"
                      {...form.register("units", { valueAsNumber: true })}
                    />
                    {form.formState.errors.units && (
                      <p className="text-xs font-medium text-destructive">{form.formState.errors.units.message}</p>
                    )}
                  </div>
                )}

                {switchAmountPreview > 0 && toScheme && (
                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                      Switch summary
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">{formatINR(switchAmountPreview)}</span> moves from{" "}
                      <span className="font-semibold">{fromHolding.schemeName}</span> →{" "}
                      <span className="font-semibold">{toScheme.schemeName}</span>
                    </p>
                  </div>
                )}

                {/* Folio */}
                <div className="space-y-3">
                  <Label>Destination folio</Label>
                  <RadioGroup
                    value={folioMode}
                    onValueChange={(v) => form.setValue("folioMode", v as "new" | "existing", { shouldValidate: true })}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    {(["new", "existing"] as const).map((m) => (
                      <label
                        key={m}
                        htmlFor={`sfolio-${m}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          folioMode === m
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <RadioGroupItem value={m} id={`sfolio-${m}`} />
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
                    Review switch <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && detailValues && fromHolding && toScheme && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Review your switch</CardTitle>
              <CardDescription>Switches are tax events — STCG/LTCG may apply on the source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <div className="rounded-xl border border-border bg-secondary/40 p-5">
                <div className="grid gap-y-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      From
                    </p>
                    <p className="mt-1 text-sm font-semibold">{fromHolding.schemeName}</p>
                    <p className="text-xs text-muted-foreground">{fromHolding.category}</p>
                  </div>
                  <div className="grid place-items-center">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                      <Repeat2 className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      To
                    </p>
                    <p className="mt-1 text-sm font-semibold">{toScheme.schemeName}</p>
                    <p className="text-xs text-muted-foreground">{toScheme.category}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-y-4 border-t border-border pt-4 sm:grid-cols-2">
                  <ReviewRow
                    label="Mode"
                    value={
                      detailValues.mode === "all"
                        ? "Switch everything"
                        : detailValues.mode === "amount"
                          ? "By amount"
                          : "By units"
                    }
                  />
                  <ReviewRow label="Switch amount" value={formatINR(switchAmountPreview)} accent />
                  <ReviewRow
                    label="Folio"
                    value={detailValues.folioMode === "new" ? "New folio" : `Existing — ${detailValues.folioNumber ?? ""}`}
                  />
                  <ReviewRow label="AMC" value={fromHolding.amc} />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs text-muted-foreground">
                  A switch is treated as a redemption from the source and a fresh purchase in the destination. Capital
                  gains and exit load (if applicable) on the source units may apply.
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
                <Button type="button" onClick={placeSwitch} disabled={mutation.isPending} className="gap-1.5">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>Confirm switch</>
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
      <Stat label="Source value" value={formatINR(holding.currentValue)} accent />
      <Stat label="Units" value={holding.units.toLocaleString("en-IN", { maximumFractionDigits: 3 })} />
      <Stat label="NAV" value={`₹${holding.currentNav.toFixed(2)}`} />
      <Stat label="Return" value={`${holding.returnPct.toFixed(1)}%`} />
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
