type Role = "admin" | "manager" | "inspector" | "viewer";

// Routes each role is allowed to access (prefix match)
const ROLE_ROUTES: Record<Role, string[]> = {
  admin: [
    "/dashboard", "/compliance", "/violations", "/inspections", "/mines",
    "/maps", "/ai-insights", "/reports", "/notifications", "/contractors",
    "/production", "/ocr", "/ppe-check", "/worker-tracking", "/users", "/settings",
  ],
  manager: [
    "/dashboard", "/compliance", "/violations", "/inspections", "/mines",
    "/maps", "/ai-insights", "/reports", "/notifications", "/contractors",
    "/production", "/ocr", "/ppe-check", "/worker-tracking", "/settings",
  ],
  inspector: [
    "/dashboard", "/compliance", "/violations", "/inspections", "/mines",
    "/maps", "/notifications", "/ocr", "/ppe-check", "/worker-tracking",
  ],
  viewer: [
    "/dashboard", "/compliance", "/violations", "/inspections", "/mines",
    "/maps", "/ai-insights", "/notifications",
  ],
};

export function canAccess(role: Role | undefined | null, path: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role] ?? [];
  return allowed.some((r) => path === r || path.startsWith(r + "/"));
}

export function allowedRoutes(role: Role | undefined | null): string[] {
  if (!role) return [];
  return ROLE_ROUTES[role] ?? [];
}
