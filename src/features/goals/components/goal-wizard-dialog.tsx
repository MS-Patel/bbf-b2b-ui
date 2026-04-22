import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Car,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  PiggyBank,
  Plane,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardStepper } from "@/features/orders/components/wizard-stepper";
import { goalWizardSchema, type GoalWizardValues } from "@/features/goals/schemas";
import { cn } from "@/lib/utils";
import { formatCompactINR } from "@/lib/format";
import type { Goal, GoalCategory } from "@/types/goals";

interface GoalWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (goal: Goal) => void;
}

const STEPS = [
  { id: "category", label: "Pick category" },
  { id: "target", label: "Target & date" },
  { id: "plan", label: "Monthly plan" },
];

const CATEGORIES: Array<{ value: GoalCategory; label: string; icon: typeof Target }> = [
  { value: "retirement", label: "Retirement", icon: ShieldCheck },
  { value: "house", label: "Buy a house", icon: Home },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "travel", label: "Travel", icon: Plane },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "emergency", label: "Emergency fund", icon: PiggyBank },
  { value: "wealth", label: "Wealth building", icon: Briefcase },
];

export function GoalWizardDialog({ open, onOpenChange, onCreate }: GoalWizardDialogProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const defaultDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().slice(0, 10);
  })();

  const form = useForm<GoalWizardValues>({
    resolver: zodResolver(goalWizardSchema),
    defaultValues: {
      name: "",
      category: "wealth",
      priority: "medium",
      targetAmount: 1000000,
      targetDate: defaultDate,
      monthlyContribution: 10000,
      expectedReturnPct: 12,
    },
    mode: "onChange",
  });

  const reset = () => {
    setStep(0);
    form.reset();
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const next = async () => {
    const fields: Array<keyof GoalWizardValues> =
      step === 0
        ? ["category", "name", "priority"]
        : step === 1
        ? ["targetAmount", "targetDate"]
        : ["monthlyContribution", "expectedReturnPct"];
    const ok = await form.trigger(fields);
    if (!ok) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      void onSubmit();
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    const goal: Goal = {
      id: `goal_${Date.now()}`,
      name: values.name,
      category: values.category,
      priority: values.priority,
      status: "on_track",
      targetAmount: values.targetAmount,
      currentAmount: 0,
      monthlyContribution: values.monthlyContribution,
      expectedReturnPct: values.expectedReturnPct,
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: values.targetDate,
      inflationAdjusted: false,
      linkedHoldings: [],
    };
    onCreate(goal);
    setSubmitting(false);
    toast.success("Goal created", { description: `${values.name} is now being tracked.` });
    handleClose(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a new goal</DialogTitle>
          <DialogDescription>
            Map your investments to a life event — we’ll track it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <WizardStepper steps={STEPS} current={step} />
        </div>

        <div className="min-h-[260px] py-2">
          {step === 0 && <CategoryStep form={form} />}
          {step === 1 && <TargetStep form={form} />}
          {step === 2 && <PlanStep form={form} />}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 0 ? handleClose(false) : setStep(step - 1))}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button type="button" onClick={next} className="gap-2" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === STEPS.length - 1 ? null : (
              <ArrowRight className="h-4 w-4" />
            )}
            {step === STEPS.length - 1 ? "Create goal" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Steps ─────────────────────────────────────────────────────────── */

type FormType = ReturnType<typeof useForm<GoalWizardValues>>;

function CategoryStep({ form }: { form: FormType }) {
  const selected = form.watch("category");
  return (
    <div className="space-y-5">
      <div>
        <Label>Category</Label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = selected === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => form.setValue("category", c.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-primary shadow-glow"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Icon className="h-5 w-5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Goal name</Label>
          <Input id="name" placeholder="e.g. Down-payment for flat" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) => form.setValue("priority", v as "high" | "medium" | "low", { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function TargetStep({ form }: { form: FormType }) {
  const target = form.watch("targetAmount");
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="targetAmount">Target amount (₹)</Label>
        <Input
          id="targetAmount"
          type="number"
          min={10000}
          step={10000}
          {...form.register("targetAmount", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Target: <span className="font-semibold text-foreground">{formatCompactINR(target || 0)}</span>
        </p>
        {form.formState.errors.targetAmount && (
          <p className="text-xs text-destructive">{form.formState.errors.targetAmount.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="targetDate">Target date</Label>
        <Input id="targetDate" type="date" {...form.register("targetDate")} />
        {form.formState.errors.targetDate && (
          <p className="text-xs text-destructive">{form.formState.errors.targetDate.message}</p>
        )}
      </div>
    </div>
  );
}

function PlanStep({ form }: { form: FormType }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="monthlyContribution">Monthly SIP contribution (₹)</Label>
        <Input
          id="monthlyContribution"
          type="number"
          min={0}
          step={500}
          {...form.register("monthlyContribution", { valueAsNumber: true })}
        />
        {form.formState.errors.monthlyContribution && (
          <p className="text-xs text-destructive">
            {form.formState.errors.monthlyContribution.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="expectedReturnPct">Expected annual return (%)</Label>
        <Input
          id="expectedReturnPct"
          type="number"
          min={1}
          max={30}
          step={0.5}
          {...form.register("expectedReturnPct", { valueAsNumber: true })}
        />
        {form.formState.errors.expectedReturnPct && (
          <p className="text-xs text-destructive">
            {form.formState.errors.expectedReturnPct.message}
          </p>
        )}
      </div>
      <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        You can link existing holdings or start a new SIP from the Goals page after creation.
      </div>
    </div>
  );
}
