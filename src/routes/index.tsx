import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Briefcase, ShieldCheck, Sparkles, Users, Wallet, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ComplianceFooter } from "@/components/layout/compliance-footer";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated && user) {
      throw redirect({ to: ROLE_HOME[user.role] });
    }
  },
  head: () => ({
    meta: [
      { title: "BuyBestFin Partner Portal — Admin, RM & Distributor" },
      {
        name: "description",
        content:
          "Operate the BuyBestFin platform: manage clients, reconcile RTA mailbacks, and track commissions across Admin, RM, and Distributor consoles.",
      },
      { property: "og:title", content: "BuyBestFin Partner Portal" },
      {
        property: "og:description",
        content: "Internal & partner console for the BuyBestFin mutual fund platform.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <BrandLogo to="/" />
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/login">
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 gradient-hero" />
          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
            <Badge variant="secondary" className="mb-5 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
              Partner & Operations Console
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Run the entire mutual-fund value chain on{" "}
              <span className="gradient-text-brand">one platform</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              BuyBestFin gives Admin, RM, and Distributor teams real-time NAV ingestion, BSE Star MF
              order routing, automated RTA reconciliation, and a built-in commission engine.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  Sign in to console <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-success" /> SEBI · AMFI · NDML
              </span>
              <span>BSE Star MF order routing</span>
              <span>CAMS &amp; KFinTech reconciliation</span>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
            <Persona
              icon={Sparkles}
              title="Admin operations"
              description="System dashboards, user & role management, RTA reconciliation, commissions & payouts, integration logs."
            />
            <Persona
              icon={Users}
              title="Relationship Managers"
              description="Service your client roster, drive onboarding, view portfolios as your client, and track earnings."
            />
            <Persona
              icon={Briefcase}
              title="Distributors"
              description="Track AUM under management, monitor commissions and payouts, and download statements."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Sparkles} value="₹24,000 Cr" label="AUM serviced" />
            <Stat icon={Wallet} value="3,200+" label="Daily orders" />
            <Stat icon={Users} value="12,800+" label="Active investors" />
            <Stat icon={ShieldCheck} value="99.9%" label="BSE uptime" />
          </div>

          <div className="mt-16 rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Already a partner?
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Sign in with your invited credentials. Partner accounts are provisioned by the
                  Admin team — there is no public sign-up.
                </p>
              </div>
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  Sign in <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <ComplianceFooter />
    </div>
  );
}

function Persona({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-card transition-shadow hover:shadow-elegant">
      <div className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
