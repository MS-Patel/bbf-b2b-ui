import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, ShieldCheck, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/feedback/status-badge";
import { AllocationDonut } from "@/features/portfolio/components/allocation-donut";
import { useAdminOverviewQuery, useIntegrationsQuery } from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_HOME } from "@/features/auth/role-routes";
import { formatCompactINR } from "@/lib/format";
import type { IntegrationStatus } from "@/types/admin";

export const Route = createFileRoute("/app/admin/")({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    if (user && user.role !== "admin") throw redirect({ to: ROLE_HOME[user.role] });
  },
  head: () => ({ meta: [{ title: "Admin overview — WealthOS" }] }),
  component: AdminDashboard,
});

const STATUS_TONE: Record<IntegrationStatus, StatusTone> = {
  operational: "success",
  degraded: "warning",
  down: "destructive",
};

function AdminDashboard() {
  const { data: overview } = useAdminOverviewQuery();
  const { data: integrations } = useIntegrationsQuery();

  const stats = overview
    ? [
        { label: "Total AUM", value: formatCompactINR(overview.totalAum), icon: Wallet },
        { label: "Active investors", value: overview.activeInvestors.toLocaleString("en-IN"), icon: Users },
        { label: "Orders today", value: overview.ordersToday.toLocaleString("en-IN"), icon: Activity },
        { label: "KYC pending", value: String(overview.kycPending), icon: ShieldCheck },
      ]
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="System overview"
        description="Monitor platform health, AUM, integration pipelines, and operational throughput."
        actions={
          <Button asChild variant="outline" className="gap-1.5">
            <Link to="/app/admin/system">
              View integrations <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="shadow-card">
                <CardContent className="p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-glow">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Orders — last 30 days</CardTitle>
              <CardDescription>Daily order volume across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pb-4 sm:px-4">
              {overview && (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={overview.ordersTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      stroke="var(--color-muted-foreground)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      minTickGap={24}
                    />
                    <YAxis stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} fontSize={11} width={48} />
                    <Tooltip
                      labelFormatter={(v) => new Date(v as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      contentStyle={{ borderRadius: 8, background: "var(--color-popover)", border: "1px solid var(--color-border)" }}
                    />
                    <Area type="monotone" dataKey="orders" stroke="var(--color-accent)" strokeWidth={2.4} fill="url(#ordersFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>AUM by asset</CardTitle>
              <CardDescription>Platform allocation split.</CardDescription>
            </CardHeader>
            <CardContent>
              {overview && (
                <AllocationDonut
                  data={overview.aumByAsset}
                  centerLabel="Total"
                  centerValue={formatCompactINR(overview.totalAum)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Integration health</CardTitle>
            <CardDescription>Live status of BSE Star MF, NDML, and RTAs.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(integrations?.health ?? []).map((h) => (
              <div key={h.name} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{h.name}</p>
                  <StatusBadge tone={STATUS_TONE[h.status]} label={h.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{h.uptime.toFixed(2)}% uptime · {h.latencyMs}ms</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
