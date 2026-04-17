import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  collapsed?: boolean;
  to?: string;
}

export function BrandLogo({ className, collapsed = false, to = "/" }: BrandLogoProps) {
  return (
    <Link to={to} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl gradient-accent shadow-glow transition-smooth group-hover:scale-105">
        <Sparkles className="h-4.5 w-4.5 text-accent-foreground" strokeWidth={2.5} />
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">WealthOS</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Mutual Funds
          </span>
        </span>
      )}
    </Link>
  );
}
