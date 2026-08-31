// Role-based access control for LeadFlow CRM.
// Each "permission" maps to an area of the app. Nav, pages, and actions
// all check against these.

export type Role = "admin" | "manager" | "agent" | "production";

export type Permission =
  | "dashboard"
  | "leads"
  | "call_center"
  | "appointments"
  | "estimates"
  | "invoices"
  | "sales"
  | "production"
  | "marketing"
  | "reports"
  | "import" // bulk import / data migration
  | "settings" // manage sources, products, reps
  | "users"; // manage login users & invites (admin only)

export const ROLES: { key: Role; label: string; description: string }[] = [
  {
    key: "admin",
    label: "Administrator",
    description: "Full access, including user management and all settings.",
  },
  {
    key: "manager",
    label: "Sales Manager",
    description: "All CRM areas plus marketing & reports. No user management.",
  },
  {
    key: "agent",
    label: "Sales / Call Agent",
    description: "Prospects, call center, appointments, and sales only.",
  },
  {
    key: "production",
    label: "Production",
    description: "Production board, prospects, and appointments.",
  },
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard",
    "leads",
    "call_center",
    "appointments",
    "estimates",
    "invoices",
    "sales",
    "production",
    "marketing",
    "reports",
    "import",
    "settings",
    "users",
  ],
  manager: [
    "dashboard",
    "leads",
    "call_center",
    "appointments",
    "estimates",
    "invoices",
    "sales",
    "production",
    "marketing",
    "reports",
    "import",
  ],
  agent: ["dashboard", "leads", "appointments", "estimates", "sales"],
  production: ["dashboard", "leads", "appointments", "production"],
};

export function can(role: string | undefined | null, perm: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as Role];
  return perms ? perms.includes(perm) : false;
}

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.key === role)?.label ?? role;
}
