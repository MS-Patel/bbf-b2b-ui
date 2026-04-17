import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NAV_BY_ROLE, SHARED_BOTTOM_NAV, type NavItem } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

function NavLinkItem({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-card",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-sidebar-primary transition-smooth",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon className={cn("h-4.5 w-4.5 shrink-0", active && "text-sidebar-primary")} strokeWidth={2} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="h-5 border-0 bg-sidebar-primary/15 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-primary"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sections = user ? NAV_BY_ROLE[user.role] : [];

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-smooth lg:flex",
        collapsed ? "w-[78px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <BrandLogo collapsed={collapsed} to="/" />
      </div>

      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <NavLinkItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  active={pathname === item.to || pathname.startsWith(item.to + "/")}
                />
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex flex-col gap-1">
          {SHARED_BOTTOM_NAV.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              active={pathname.startsWith(item.to)}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn(
            "mt-3 w-full justify-center gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-smooth", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
