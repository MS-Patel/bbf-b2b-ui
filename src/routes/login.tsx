import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";

import { useAuthStore } from "@/stores/auth-store";
import {
  useLoginMutation,
  useOtpLoginMutation,
  useRequestOtpMutation,
} from "@/features/auth/api";
import {
  loginSchema,
  otpVerifySchema,
  ROLE_OPTIONS,
  type LoginFormValues,
  type OtpVerifyFormValues,
} from "@/features/auth/schemas";
import { ROLE_HOME } from "@/features/auth/role-routes";
import type { UserRole } from "@/types/auth";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — BuyBestFin" },
      { name: "description", content: "Sign in to your BuyBestFin account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const handleSuccess = (role: UserRole) => {
    toast.success("Welcome back");
    navigate({ to: ROLE_HOME[role] });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
        <BrandPanel />
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <BrandLogo />
            </div>
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                Secure access
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to manage portfolios, clients, and operations.
              </p>
            </div>

            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/70">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="otp">OTP</TabsTrigger>
              </TabsList>
              <TabsContent value="password" className="mt-6">
                <PasswordForm onSuccess={handleSuccess} setSession={setSession} />
              </TabsContent>
              <TabsContent value="otp" className="mt-6">
                <OtpForm onSuccess={handleSuccess} setSession={setSession} />
              </TabsContent>
            </Tabs>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need access? Partner accounts are invite-only — contact your administrator.
            </p>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in you agree to BuyBestFin{" "}
              <a className="font-medium text-foreground underline-offset-4 hover:underline">Terms</a>{" "}
              and{" "}
              <a className="font-medium text-foreground underline-offset-4 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Brand panel ───────────────────────────────────────────────────── */

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 55%), radial-gradient(circle at 80% 85%, color-mix(in oklab, var(--primary-glow) 45%, transparent), transparent 60%), var(--sidebar)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-12 p-12">
        <BrandLogo />
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55">
            Wealth platform
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
            One platform for the entire mutual-fund value chain.
          </h2>
          <p className="mt-4 text-base text-sidebar-foreground/70">
            Real-time NAVs, BSE Star MF order routing, automated reconciliation, and
            commission engines — built for investors, RMs, distributors, and ops teams.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 p-12">
        <FeatureChip icon={ShieldCheck} title="SEBI-compliant" subtitle="KYC, AMFI, NDML" />
        <FeatureChip icon={TrendingUp} title="₹2,400 Cr+" subtitle="AUM serviced" />
      </div>
    </aside>
  );
}

function FeatureChip({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof ShieldCheck;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4 backdrop-blur-sm">
      <div className="grid h-9 w-9 place-items-center rounded-lg gradient-accent shadow-glow">
        <Icon className="h-4.5 w-4.5 text-accent-foreground" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-sidebar-foreground/60">{subtitle}</p>
    </div>
  );
}

/* ─── Password form ─────────────────────────────────────────────────── */

interface FormProps {
  onSuccess: (role: UserRole) => void;
  setSession: ReturnType<typeof useAuthStore.getState>["setSession"];
}

function PasswordForm({ onSuccess, setSession }: FormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@buybestfin.dev", password: "demo1234", role: "admin" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await login.mutateAsync(values);
      setSession(result);
      onSuccess(result.user.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <RoleSelect
        value={form.watch("role")}
        onChange={(v) => form.setValue("role", v, { shouldValidate: true })}
      />

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className="pr-10"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full gap-2" size="lg" disabled={login.isPending}>
        {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Sign in
      </Button>

      <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-center text-xs text-muted-foreground">
        Mock mode — any email + password ≥6 chars works.
      </p>
    </form>
  );
}

/* ─── OTP form ──────────────────────────────────────────────────────── */

function OtpForm({ onSuccess, setSession }: FormProps) {
  const [otpSent, setOtpSent] = useState(false);
  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useOtpLoginMutation();

  const form = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { identifier: "", otp: "", role: "admin" },
  });

  const handleRequest = async () => {
    const id = form.getValues("identifier");
    if (!id || id.length < 6) {
      form.setError("identifier", { message: "Enter your email or mobile number" });
      return;
    }
    try {
      await requestOtp.mutateAsync(id);
      setOtpSent(true);
      toast.success("OTP sent. Use 123456 in mock mode.");
    } catch {
      toast.error("Could not send OTP");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await verifyOtp.mutateAsync(values);
      setSession(result);
      onSuccess(result.user.role);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <RoleSelect
        value={form.watch("role")}
        onChange={(v) => form.setValue("role", v, { shouldValidate: true })}
      />

      <div className="space-y-1.5">
        <Label htmlFor="identifier">Email or mobile</Label>
        <Input
          id="identifier"
          placeholder="you@company.com or +91…"
          {...form.register("identifier")}
        />
        {form.formState.errors.identifier && (
          <p className="text-xs text-destructive">{form.formState.errors.identifier.message}</p>
        )}
      </div>

      {otpSent && (
        <div className="space-y-1.5">
          <Label htmlFor="otp">6-digit code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className="tracking-[0.5em] text-center font-mono text-lg"
            {...form.register("otp")}
          />
          {form.formState.errors.otp && (
            <p className="text-xs text-destructive">{form.formState.errors.otp.message}</p>
          )}
        </div>
      )}

      {!otpSent ? (
        <Button
          type="button"
          onClick={handleRequest}
          className="w-full gap-2"
          size="lg"
          disabled={requestOtp.isPending}
        >
          {requestOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Send code
        </Button>
      ) : (
        <Button type="submit" className="w-full gap-2" size="lg" disabled={verifyOtp.isPending}>
          {verifyOtp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Verify & sign in
        </Button>
      )}
    </form>
  );
}

/* ─── Role select ───────────────────────────────────────────────────── */

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (v: UserRole) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Sign in as</Label>
      <Select value={value} onValueChange={(v) => onChange(v as UserRole)}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex flex-col">
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
