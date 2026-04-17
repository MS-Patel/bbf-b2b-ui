import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/auth";
import { ROLE_LABEL } from "@/features/auth/role-routes";

interface RoleGuardErrorProps {
  required: ReadonlyArray<UserRole>;
  current: UserRole | undefined;
  homePath: string;
}

export function RoleGuardError({ required, current, homePath }: RoleGuardErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning/15">
          <ShieldAlert className="h-7 w-7 text-warning" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for {required.map((r) => ROLE_LABEL[r]).join(" / ")} accounts only.
          {current && (
            <>
              {" "}
              You're signed in as <span className="font-medium text-foreground">{ROLE_LABEL[current]}</span>.
            </>
          )}
        </p>
        <Button asChild className="mt-6">
          <Link to={homePath}>Go to your dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
