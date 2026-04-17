import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useLogoutMutation } from "@/features/auth/api";
import { ROLE_LABEL } from "@/features/auth/role-routes";
import { toast } from "sonner";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppTopbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const logout = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      clearSession();
      toast.success("Signed out");
      navigate({ to: "/login" });
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search funds, clients, transactions…"
          className="h-9 border-border/70 bg-secondary/60 pl-9 placeholder:text-muted-foreground/70 focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent shadow-glow" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2.5 rounded-full border border-border/70 bg-card px-2 py-1 pr-3 text-left transition-smooth hover:bg-secondary/80">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initialsOf(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-xs leading-tight sm:block">
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABEL[user.role]}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span>{user.fullName}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              <Badge variant="secondary" className="mt-1 w-fit text-[10px] uppercase tracking-wider">
                {ROLE_LABEL[user.role]}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
