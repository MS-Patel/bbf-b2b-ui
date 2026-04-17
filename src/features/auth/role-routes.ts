import type { UserRole } from "@/types/auth";

/**
 * Default landing route for each authenticated role.
 * Add new role-aware redirects here, never hardcode in components.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  investor: "/app/investor",
  admin: "/app/admin",
  rm: "/app/rm",
  distributor: "/app/distributor",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  investor: "Investor",
  admin: "Admin",
  rm: "Relationship Manager",
  distributor: "Distributor",
};
