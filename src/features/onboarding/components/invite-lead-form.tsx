import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Send, UserPlus } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { inviteLeadSchema, type InviteLeadInput } from "@/features/onboarding/schemas";
import { useInviteLeadMutation } from "@/features/onboarding/api";
import type { OwnerRole } from "@/features/onboarding/types";
import { STATE_CHOICES } from "@/features/admin/form-constants";
import type { ReactNode } from "react";

interface Props {
  owner: { id: string; role: OwnerRole; name: string };
  eyebrow: string;
  backTo: "/app/admin/onboarding" | "/app/rm/onboarding" | "/app/distributor/onboarding";
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children, full }: { label: string; error?: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function InviteLeadForm({ owner, eyebrow, backTo }: Props) {
  const navigate = useNavigate();
  const invite = useInviteLeadMutation(owner);

  const form = useForm<InviteLeadInput>({
    resolver: zodResolver(inviteLeadSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      alternatePhone: "",
      pan: "",
      dob: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      riskProfile: "Moderate",
      investmentHorizon: "3-5y",
      source: "RM Direct",
      assignedRm: "",
      notes: "",
    },
  });

  const errors = form.formState.errors;

  async function onSubmit(values: InviteLeadInput) {
    // Compose extras into notes so mock store retains them
    const extras: string[] = [];
    if (values.dob) extras.push(`DOB: ${values.dob}`);
    if (values.addressLine1 || values.city)
      extras.push(
        `Address: ${[values.addressLine1, values.addressLine2, values.city, values.state, values.pincode, values.country]
          .filter(Boolean)
          .join(", ")}`,
      );
    if (values.alternatePhone) extras.push(`Alt phone: ${values.alternatePhone}`);
    if (values.riskProfile) extras.push(`Risk: ${values.riskProfile}`);
    if (values.investmentHorizon) extras.push(`Horizon: ${values.investmentHorizon}`);
    const composedNotes = [values.notes, extras.join(" • ")].filter(Boolean).join("\n");

    const lead = await invite.mutateAsync({ ...values, notes: composedNotes });

    if (lead.inviteLink) {
      try {
        await navigator.clipboard?.writeText(lead.inviteLink);
        toast.success("Investor invited", { description: "Magic link copied to clipboard." });
      } catch {
        toast.success("Investor invited", { description: lead.inviteLink });
      }
    }
    form.reset();
    navigate({ to: backTo });
  }

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Invite a new investor"
        description="Capture lead details and send a secure onboarding magic link."
        actions={
          <Button asChild variant="ghost" className="gap-1.5">
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <Section title="Identity" description="Basic identification used to dispatch the magic link.">
            <Field label="Full name" error={errors.fullName?.message}>
              <Input {...form.register("fullName")} placeholder="Aarav Mehta" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...form.register("email")} placeholder="aarav@example.in" />
            </Field>
            <Field label="Mobile" error={errors.phone?.message}>
              <Input {...form.register("phone")} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Alternate mobile">
              <Input {...form.register("alternatePhone")} placeholder="+91 98765 43211" />
            </Field>
            <Field label="PAN" error={errors.pan?.message}>
              <Input {...form.register("pan")} placeholder="ABCDE1234F" className="uppercase" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register("dob")} />
            </Field>
          </Section>

          <Section title="Address" description="Mailing address used for KYC verification.">
            <Field label="Address line 1" full>
              <Input {...form.register("addressLine1")} placeholder="Flat / building / street" />
            </Field>
            <Field label="Address line 2" full>
              <Input {...form.register("addressLine2")} placeholder="Area / landmark" />
            </Field>
            <Field label="City">
              <Input {...form.register("city")} placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <Select value={form.watch("state") ?? ""} onValueChange={(v) => form.setValue("state", v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {STATE_CHOICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pincode">
              <Input {...form.register("pincode")} placeholder="400001" inputMode="numeric" />
            </Field>
            <Field label="Country">
              <Input {...form.register("country")} />
            </Field>
          </Section>

          <Section title="Investment profile" description="Used to suggest suitable schemes during onboarding.">
            <Field label="Risk profile">
              <Select
                value={form.watch("riskProfile") ?? "Moderate"}
                onValueChange={(v) => form.setValue("riskProfile", v as InviteLeadInput["riskProfile"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservative">Conservative</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Investment horizon">
              <Select
                value={form.watch("investmentHorizon") ?? "3-5y"}
                onValueChange={(v) => form.setValue("investmentHorizon", v as InviteLeadInput["investmentHorizon"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1y">Less than 1 year</SelectItem>
                  <SelectItem value="1-3y">1 – 3 years</SelectItem>
                  <SelectItem value="3-5y">3 – 5 years</SelectItem>
                  <SelectItem value="5y+">More than 5 years</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Source & ownership">
            <Field label="Lead source">
              <Select value={form.watch("source")} onValueChange={(v) => form.setValue("source", v as InviteLeadInput["source"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Campaign">Campaign</SelectItem>
                  <SelectItem value="RM Direct">RM Direct</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned RM (optional)">
              <Input {...form.register("assignedRm")} placeholder="RM employee code or name" />
            </Field>
            <Field label="Internal notes" full>
              <Textarea {...form.register("notes")} rows={3} placeholder="Conversation context, products discussed…" />
            </Field>
          </Section>

          <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Owner: <span className="font-medium text-foreground">{owner.name}</span> · {owner.role.toUpperCase()}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" asChild>
                  <Link to={backTo}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={invite.isPending} className="gap-1.5">
                  {invite.isPending ? <UserPlus className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                  Send invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
