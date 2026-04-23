import type { UserRole } from "@/types/auth";

/**
 * Default landing route for each authenticated B2B role.
 * Investor surfaces are reachable only via impersonation, so they
 * are intentionally absent from this map.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: "/app/admin",
  rm: "/app/rm",
  distributor: "/app/distributor",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  rm: "Relationship Manager",
  distributor: "Distributor",
};
