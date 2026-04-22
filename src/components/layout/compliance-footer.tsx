import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function ComplianceFooter() {
  return (
    <footer className="border-t border-border bg-card/40 px-6 py-6 text-xs text-muted-foreground sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-sm font-semibold">Navinchandra Securities Pvt. Ltd.</span>
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              ARN 147231
            </span>
          </div>
          <p className="leading-relaxed">
            Mutual fund investments are subject to market risks. Read all scheme-related documents
            carefully before investing. Past performance is not indicative of future returns.
            Distribution services on this platform are facilitated through BSE Star MF.
          </p>
          <p className="text-[11px]">
            AMFI registered · NSE / BSE member · CIN U67120MH1995PTC093248 · SEBI Regn. No. INZ000XXXXXX
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-medium">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <a className="hover:text-foreground" href="#">Terms of use</a>
          <a className="hover:text-foreground" href="#">Privacy policy</a>
          <a className="hover:text-foreground" href="#">Grievance redressal</a>
          <a className="hover:text-foreground" href="#">Investor charter</a>
          <a className="hover:text-foreground" href="#">SEBI SCORES</a>
        </nav>
      </div>
    </footer>
  );
}
