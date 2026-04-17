import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import type { RouterAppContext } from "@/router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeApplier } from "@/components/theme/theme-applier";
import { registerUnauthorizedHandler } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">404</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "WealthOS — Mutual Fund & Wealth Platform" },
      {
        name: "description",
        content:
          "WealthOS is a unified mutual-fund and wealth-management platform for investors, RMs, distributors, and operations teams.",
      },
      { name: "author", content: "WealthOS" },
      { property: "og:title", content: "WealthOS — Mutual Fund & Wealth Platform" },
      { property: "og:description", content: "Modern mutual-fund operations for the entire value chain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    registerUnauthorizedHandler(() => clearSession());
  }, [clearSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
