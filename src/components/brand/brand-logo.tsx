import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/logo.png";

interface BrandLogoProps {
  className?: string;
  collapsed?: boolean;
  to?: string;
}

export function BrandLogo({ className, collapsed = false, to = "/" }: BrandLogoProps) {
  return (
    <Link to={to} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-border transition-smooth group-hover:scale-105">
        <img src={logoUrl} alt="BuyBestFin" className="h-8 w-8 object-contain" />
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight">BuyBestFin</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Navinchandra Securities · ARN 147231
          </span>
        </span>
      )}
    </Link>
  );
}
