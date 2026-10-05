export const roles = ["student", "faculty", "admin", "super_admin"] as const;
export type AppRole = (typeof roles)[number];

export type AuthenticatedPrincipal = {
  userId: string;
  role: AppRole;
  departmentId: string | null;
};

export type ProtectedResource = {
  ownerUserId?: string | null;
  departmentId?: string | null;
};

export function can(
  principal: AuthenticatedPrincipal,
  action: "profile:read" | "profile:write" | "academic:read" | "achievement:verify" | "content:approve" | "roles:manage",
  resource: ProtectedResource = {},
): boolean {
  if (principal.role === "super_admin") return true;
  if (action === "roles:manage") return false;
  if (action === "content:approve") return principal.role === "admin";
  if (action === "achievement:verify") return principal.role === "faculty" || principal.role === "admin";
  if (action === "academic:read") {
    return principal.role === "admin" || (principal.role === "faculty" && principal.departmentId === resource.departmentId) || principal.userId === resource.ownerUserId;
  }
  if (action === "profile:write") return principal.userId === resource.ownerUserId;
  return Boolean(resource.ownerUserId === principal.userId || principal.role === "faculty" || principal.role === "admin");
}

export function assertAuthorized(allowed: boolean): asserts allowed {
  if (!allowed) throw new Error("FORBIDDEN");
}
