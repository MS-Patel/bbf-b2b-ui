import * as React from "react";
import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Mail, Server, Hash, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/admin/system-config")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "System Configuration — Admin" }] }),
  component: AdminSystemConfigPage,
});

// ---------- Schemas ----------
const integrationsSchema = z.object({
  bseUserId: z.string().min(1, "Required"),
  bseMemberCode: z.string().min(1, "Required"),
  bsePassword: z.string().min(1, "Required"),
  bsePassphrase: z.string().optional(),
  bseEnv: z.enum(["uat", "production"]),
  nsdlKraApiUrl: z.string().url("Invalid URL"),
  nsdlKraApiKey: z.string().min(1, "Required"),
  nsdlKraApiSecret: z.string().min(1, "Required"),
  ndmlEsignApiKey: z.string().min(1, "Required"),
  ndmlEsignApiSecret: z.string().min(1, "Required"),
  camsRtaPassword: z.string().min(1, "Required"),
  karvyRtaPassword: z.string().min(1, "Required"),
});

const emailSchema = z.object({
  smtpHost: z.string().min(1),
  smtpPort: z.coerce.number().min(1).max(65535),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().min(1),
  smtpEncryption: z.enum(["none", "tls", "ssl"]),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyToEmail: z.string().email().optional().or(z.literal("")),
  bccCompliance: z.string().email().optional().or(z.literal("")),
});

const seriesSchema = z.object({
  brokerCodePrefix: z.string().min(1).max(8),
  brokerCodeNext: z.coerce.number().min(1),
  brokerCodePadding: z.coerce.number().min(1).max(10),
  rmCodePrefix: z.string().min(1).max(8),
  rmCodeNext: z.coerce.number().min(1),
  rmCodePadding: z.coerce.number().min(1).max(10),
  investorCodePrefix: z.string().min(1).max(8),
  investorCodeNext: z.coerce.number().min(1),
  orderRefPrefix: z.string().min(1).max(8),
  orderRefNext: z.coerce.number().min(1),
  resetCycle: z.enum(["never", "yearly", "monthly"]),
});

const securitySchema = z.object({
  sessionTimeoutMins: z.coerce.number().min(5).max(1440),
  passwordMinLength: z.coerce.number().min(6).max(64),
  enforceMfa: z.boolean(),
  ipAllowlist: z.string().optional(),
  webhookSecret: z.string().min(8),
  jwtSigningKey: z.string().min(16),
});

// ---------- Helpers ----------
const SecretInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pr-10", className)}
          autoComplete="off"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={show ? "Hide value" : "Show value"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
SecretInput.displayName = "SecretInput";

function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

// ---------- Defaults (fixtures) ----------
const integrationsDefaults: z.infer<typeof integrationsSchema> = {
  bseUserId: "BBF12345",
  bseMemberCode: "12345",
  bsePassword: "********",
  bsePassphrase: "",
  bseEnv: "uat",
  nsdlKraApiUrl: "https://kra.ndml.in/api/v2",
  nsdlKraApiKey: "ndml_live_xxxxxxxx",
  nsdlKraApiSecret: "********",
  ndmlEsignApiKey: "esign_xxxxxxxx",
  ndmlEsignApiSecret: "********",
  camsRtaPassword: "********",
  karvyRtaPassword: "********",
};

const emailDefaults: z.infer<typeof emailSchema> = {
  smtpHost: "smtp.sendgrid.net",
  smtpPort: 587,
  smtpUsername: "apikey",
  smtpPassword: "********",
  smtpEncryption: "tls",
  fromName: "BuyBestFin",
  fromEmail: "noreply@buybestfin.com",
  replyToEmail: "support@buybestfin.com",
  bccCompliance: "compliance@buybestfin.com",
};

const seriesDefaults: z.infer<typeof seriesSchema> = {
  brokerCodePrefix: "BRK",
  brokerCodeNext: 10245,
  brokerCodePadding: 6,
  rmCodePrefix: "RM",
  rmCodeNext: 1284,
  rmCodePadding: 5,
  investorCodePrefix: "INV",
  investorCodeNext: 50231,
  orderRefPrefix: "ORD",
  orderRefNext: 800123,
  resetCycle: "never",
};

const securityDefaults: z.infer<typeof securitySchema> = {
  sessionTimeoutMins: 60,
  passwordMinLength: 10,
  enforceMfa: true,
  ipAllowlist: "",
  webhookSecret: "whsec_********",
  jwtSigningKey: "********************",
};

// ---------- Forms ----------
function IntegrationsForm() {
  const form = useForm<z.infer<typeof integrationsSchema>>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: integrationsDefaults,
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const onSubmit = (values: z.infer<typeof integrationsSchema>) => {
    console.log("integrations.save", values);
    toast.success("Integration credentials saved");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection title="BSE Star MF" description="Order routing & allocation gateway credentials.">
        <Field label="User ID" htmlFor="bseUserId" error={formState.errors.bseUserId?.message}>
          <Input id="bseUserId" {...register("bseUserId")} />
        </Field>
        <Field label="Member Code" htmlFor="bseMemberCode" error={formState.errors.bseMemberCode?.message}>
          <Input id="bseMemberCode" {...register("bseMemberCode")} />
        </Field>
        <Field label="Password" htmlFor="bsePassword" error={formState.errors.bsePassword?.message}>
          <SecretInput id="bsePassword" {...register("bsePassword")} />
        </Field>
        <Field label="Passphrase (optional)" htmlFor="bsePassphrase">
          <SecretInput id="bsePassphrase" {...register("bsePassphrase")} />
        </Field>
        <Field label="Environment" htmlFor="bseEnv">
          <Select value={watch("bseEnv")} onValueChange={(v) => setValue("bseEnv", v as "uat" | "production")}>
            <SelectTrigger id="bseEnv"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uat">UAT / Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="NSDL KRA / KYC API" description="Used for investor KYC fetch and validation.">
        <Field label="API Base URL" htmlFor="nsdlKraApiUrl" error={formState.errors.nsdlKraApiUrl?.message} className="md:col-span-2">
          <Input id="nsdlKraApiUrl" {...register("nsdlKraApiUrl")} />
        </Field>
        <Field label="API Key" htmlFor="nsdlKraApiKey" error={formState.errors.nsdlKraApiKey?.message}>
          <SecretInput id="nsdlKraApiKey" {...register("nsdlKraApiKey")} />
        </Field>
        <Field label="API Secret" htmlFor="nsdlKraApiSecret" error={formState.errors.nsdlKraApiSecret?.message}>
          <SecretInput id="nsdlKraApiSecret" {...register("nsdlKraApiSecret")} />
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="NDML eSign" description="Aadhaar eSign provider credentials.">
        <Field label="API Key" htmlFor="ndmlEsignApiKey" error={formState.errors.ndmlEsignApiKey?.message}>
          <SecretInput id="ndmlEsignApiKey" {...register("ndmlEsignApiKey")} />
        </Field>
        <Field label="API Secret" htmlFor="ndmlEsignApiSecret" error={formState.errors.ndmlEsignApiSecret?.message}>
          <SecretInput id="ndmlEsignApiSecret" {...register("ndmlEsignApiSecret")} />
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="RTA File Passwords" description="Passwords used to decrypt nightly CAS / brokerage files.">
        <Field label="CAMS RTA Password" htmlFor="camsRtaPassword" error={formState.errors.camsRtaPassword?.message}>
          <SecretInput id="camsRtaPassword" {...register("camsRtaPassword")} />
        </Field>
        <Field label="Karvy / KFintech RTA Password" htmlFor="karvyRtaPassword" error={formState.errors.karvyRtaPassword?.message}>
          <SecretInput id="karvyRtaPassword" {...register("karvyRtaPassword")} />
        </Field>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> Save credentials
        </Button>
      </div>
    </form>
  );
}

function EmailForm() {
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: emailDefaults,
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const onSubmit = (values: z.infer<typeof emailSchema>) => {
    console.log("email.save", values);
    toast.success("Email configuration saved");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection title="SMTP Server" description="Outbound mail relay used for transactional notifications.">
        <Field label="SMTP Host" htmlFor="smtpHost" error={formState.errors.smtpHost?.message}>
          <Input id="smtpHost" {...register("smtpHost")} />
        </Field>
        <Field label="SMTP Port" htmlFor="smtpPort" error={formState.errors.smtpPort?.message}>
          <Input id="smtpPort" type="number" {...register("smtpPort")} />
        </Field>
        <Field label="Username" htmlFor="smtpUsername" error={formState.errors.smtpUsername?.message}>
          <Input id="smtpUsername" {...register("smtpUsername")} />
        </Field>
        <Field label="Password / API Key" htmlFor="smtpPassword" error={formState.errors.smtpPassword?.message}>
          <SecretInput id="smtpPassword" {...register("smtpPassword")} />
        </Field>
        <Field label="Encryption" htmlFor="smtpEncryption">
          <Select value={watch("smtpEncryption")} onValueChange={(v) => setValue("smtpEncryption", v as "none" | "tls" | "ssl")}>
            <SelectTrigger id="smtpEncryption"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="tls">STARTTLS</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="Sender Identity">
        <Field label="From Name" htmlFor="fromName" error={formState.errors.fromName?.message}>
          <Input id="fromName" {...register("fromName")} />
        </Field>
        <Field label="From Email" htmlFor="fromEmail" error={formState.errors.fromEmail?.message}>
          <Input id="fromEmail" type="email" {...register("fromEmail")} />
        </Field>
        <Field label="Reply-To Email" htmlFor="replyToEmail" error={formState.errors.replyToEmail?.message}>
          <Input id="replyToEmail" type="email" {...register("replyToEmail")} />
        </Field>
        <Field label="Compliance BCC" htmlFor="bccCompliance" hint="Optional. Receives a copy of every transactional email." error={formState.errors.bccCompliance?.message}>
          <Input id="bccCompliance" type="email" {...register("bccCompliance")} />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => toast.success("Test email queued")}>Send test email</Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> Save email config
        </Button>
      </div>
    </form>
  );
}

function preview(prefix: string, next: number, padding: number) {
  return `${prefix}${String(next).padStart(padding, "0")}`;
}

function SeriesForm() {
  const form = useForm<z.infer<typeof seriesSchema>>({
    resolver: zodResolver(seriesSchema),
    defaultValues: seriesDefaults,
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const v = watch();
  const onSubmit = (values: z.infer<typeof seriesSchema>) => {
    console.log("series.save", values);
    toast.success("Code series updated");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection title="Distributor / Broker Code" description={`Next: ${preview(v.brokerCodePrefix, v.brokerCodeNext, v.brokerCodePadding)}`}>
        <Field label="Prefix" htmlFor="brokerCodePrefix" error={formState.errors.brokerCodePrefix?.message}>
          <Input id="brokerCodePrefix" {...register("brokerCodePrefix")} />
        </Field>
        <Field label="Next Number" htmlFor="brokerCodeNext" error={formState.errors.brokerCodeNext?.message}>
          <Input id="brokerCodeNext" type="number" {...register("brokerCodeNext")} />
        </Field>
        <Field label="Padding (digits)" htmlFor="brokerCodePadding" error={formState.errors.brokerCodePadding?.message}>
          <Input id="brokerCodePadding" type="number" {...register("brokerCodePadding")} />
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="RM Employee Code" description={`Next: ${preview(v.rmCodePrefix, v.rmCodeNext, v.rmCodePadding)}`}>
        <Field label="Prefix" htmlFor="rmCodePrefix" error={formState.errors.rmCodePrefix?.message}>
          <Input id="rmCodePrefix" {...register("rmCodePrefix")} />
        </Field>
        <Field label="Next Number" htmlFor="rmCodeNext" error={formState.errors.rmCodeNext?.message}>
          <Input id="rmCodeNext" type="number" {...register("rmCodeNext")} />
        </Field>
        <Field label="Padding (digits)" htmlFor="rmCodePadding" error={formState.errors.rmCodePadding?.message}>
          <Input id="rmCodePadding" type="number" {...register("rmCodePadding")} />
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="Investor / Order References">
        <Field label="Investor Code Prefix" htmlFor="investorCodePrefix" error={formState.errors.investorCodePrefix?.message}>
          <Input id="investorCodePrefix" {...register("investorCodePrefix")} />
        </Field>
        <Field label="Investor Next" htmlFor="investorCodeNext" hint={`Next: ${v.investorCodePrefix}${v.investorCodeNext}`}>
          <Input id="investorCodeNext" type="number" {...register("investorCodeNext")} />
        </Field>
        <Field label="Order Ref Prefix" htmlFor="orderRefPrefix" error={formState.errors.orderRefPrefix?.message}>
          <Input id="orderRefPrefix" {...register("orderRefPrefix")} />
        </Field>
        <Field label="Order Ref Next" htmlFor="orderRefNext" hint={`Next: ${v.orderRefPrefix}${v.orderRefNext}`}>
          <Input id="orderRefNext" type="number" {...register("orderRefNext")} />
        </Field>
        <Field label="Reset Cycle" htmlFor="resetCycle" className="md:col-span-2">
          <Select value={watch("resetCycle")} onValueChange={(val) => setValue("resetCycle", val as "never" | "yearly" | "monthly")}>
            <SelectTrigger id="resetCycle"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never reset</SelectItem>
              <SelectItem value="yearly">Reset yearly (FY)</SelectItem>
              <SelectItem value="monthly">Reset monthly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> Save series
        </Button>
      </div>
    </form>
  );
}

function SecurityForm() {
  const form = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: securityDefaults,
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const onSubmit = (values: z.infer<typeof securitySchema>) => {
    console.log("security.save", values);
    toast.success("Security policy updated");
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <FormSection title="Session & Password Policy">
        <Field label="Session timeout (minutes)" htmlFor="sessionTimeoutMins" error={formState.errors.sessionTimeoutMins?.message}>
          <Input id="sessionTimeoutMins" type="number" {...register("sessionTimeoutMins")} />
        </Field>
        <Field label="Minimum password length" htmlFor="passwordMinLength" error={formState.errors.passwordMinLength?.message}>
          <Input id="passwordMinLength" type="number" {...register("passwordMinLength")} />
        </Field>
        <div className="flex items-center justify-between rounded-lg border border-border p-3 md:col-span-2">
          <div>
            <p className="text-sm font-medium">Enforce MFA for staff users</p>
            <p className="text-xs text-muted-foreground">Admins, RMs and Distributors must complete TOTP at every login.</p>
          </div>
          <Switch checked={watch("enforceMfa")} onCheckedChange={(c) => setValue("enforceMfa", c)} />
        </div>
        <Field label="IP allowlist" htmlFor="ipAllowlist" hint="Comma-separated CIDR blocks. Empty = allow all." className="md:col-span-2">
          <Input id="ipAllowlist" placeholder="10.0.0.0/24, 203.0.113.5/32" {...register("ipAllowlist")} />
        </Field>
      </FormSection>

      <Separator />

      <FormSection title="Server Secrets" description="Used to sign internal tokens and webhook payloads.">
        <Field label="Webhook signing secret" htmlFor="webhookSecret" error={formState.errors.webhookSecret?.message}>
          <SecretInput id="webhookSecret" {...register("webhookSecret")} />
        </Field>
        <Field label="JWT signing key" htmlFor="jwtSigningKey" error={formState.errors.jwtSigningKey?.message}>
          <SecretInput id="jwtSigningKey" {...register("jwtSigningKey")} />
        </Field>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> Save security policy
        </Button>
      </div>
    </form>
  );
}

// ---------- Page ----------
function AdminSystemConfigPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin · System"
        title="System Configuration"
        description="Manage gateway credentials, email relay, code series and security policy. Changes apply across all environments."
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="integrations" className="gap-2"><KeyRound className="h-4 w-4" /> Integrations</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
            <TabsTrigger value="series" className="gap-2"><Hash className="h-4 w-4" /> Code Series</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><ShieldCheck className="h-4 w-4" /> Security</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="h-4 w-4" /> Integration Credentials</CardTitle>
                <CardDescription>BSE Star MF, NSDL KRA, NDML eSign and RTA file passwords. Stored encrypted at rest.</CardDescription>
              </CardHeader>
              <CardContent><IntegrationsForm /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>SMTP relay used for OTPs, order confirmations and statements.</CardDescription>
              </CardHeader>
              <CardContent><EmailForm /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="series">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Auto-generated Code Series</CardTitle>
                <CardDescription>Sequence prefixes and counters for distributors, RMs, investors and orders.</CardDescription>
              </CardHeader>
              <CardContent><SeriesForm /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Security Policy</CardTitle>
                <CardDescription>Authentication rules, IP allowlist and signing secrets.</CardDescription>
              </CardHeader>
              <CardContent><SecurityForm /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
