/** Permissions granulaires pour le personnel (admins, agents, etc.) */
export const STAFF_PERMISSIONS = [
  { key: "dashboard.read", label: "Dashboard", group: "Vue d'ensemble" },
  { key: "analytics.read", label: "Analytics", group: "Vue d'ensemble" },
  { key: "finance.read", label: "Finance", group: "Vue d'ensemble" },
  { key: "parieurs.read", label: "Voir les parieurs", group: "Opérations" },
  { key: "parieurs.write", label: "Bloquer / gérer parieurs", group: "Opérations" },
  { key: "tickets.read", label: "Tickets", group: "Opérations" },
  { key: "conversations.read", label: "Conversations", group: "Opérations" },
  { key: "conversations.write", label: "Répondre / diffuser", group: "Opérations" },
  { key: "withdrawals.read", label: "Voir retraits", group: "Opérations" },
  { key: "withdrawals.write", label: "Approuver / payer retraits", group: "Opérations" },
  { key: "deposits.read", label: "Dépôts", group: "Opérations" },
  { key: "matches.read", label: "Matchs", group: "Opérations" },
  { key: "matches.write", label: "Sync matchs", group: "Opérations" },
  { key: "notifications.read", label: "Notifications", group: "Système" },
  { key: "settings.write", label: "Configuration", group: "Système" },
  { key: "logs.read", label: "Audit log", group: "Système" },
  { key: "staff.read", label: "Voir l'équipe", group: "Système" },
  { key: "staff.write", label: "Gérer l'équipe", group: "Système" },
  { key: "roles.read", label: "Voir les rôles", group: "Système" },
  { key: "roles.write", label: "Gérer rôles & permissions", group: "Système" },
] as const;

export type StaffPermissionKey = (typeof STAFF_PERMISSIONS)[number]["key"];

export const ALL_STAFF_PERMISSIONS: StaffPermissionKey[] = STAFF_PERMISSIONS.map((p) => p.key);

export function permissionsByGroup() {
  const groups = new Map<string, typeof STAFF_PERMISSIONS[number][]>();
  for (const p of STAFF_PERMISSIONS) {
    const list = groups.get(p.group) ?? [];
    list.push(p);
    groups.set(p.group, list);
  }
  return groups;
}

export const DEFAULT_STAFF_ROLES: Array<{
  name: string;
  slug: string;
  description: string;
  adminRole: "SUPER_ADMIN" | "ADMIN" | "AGENT" | "SUPPORT" | "BETIKA";
  permissions: StaffPermissionKey[];
  isSystem: boolean;
}> = [
  {
    name: "Super Admin",
    slug: "super_admin",
    description: "Accès total à la plateforme",
    adminRole: "SUPER_ADMIN",
    permissions: [...ALL_STAFF_PERMISSIONS],
    isSystem: true,
  },
  {
    name: "Administrateur",
    slug: "admin",
    description: "Gestion opérationnelle sans gestion du personnel",
    adminRole: "ADMIN",
    permissions: ALL_STAFF_PERMISSIONS.filter((k) => !k.startsWith("staff.") && !k.startsWith("roles.")),
    isSystem: true,
  },
  {
    name: "Agent",
    slug: "agent",
    description: "Support joueurs, conversations et retraits",
    adminRole: "AGENT",
    permissions: [
      "dashboard.read",
      "parieurs.read",
      "parieurs.write",
      "tickets.read",
      "conversations.read",
      "conversations.write",
      "withdrawals.read",
      "withdrawals.write",
      "deposits.read",
      "notifications.read",
    ],
    isSystem: true,
  },
  {
    name: "Support",
    slug: "support",
    description: "Assistance et modération légère",
    adminRole: "SUPPORT",
    permissions: [
      "dashboard.read",
      "parieurs.read",
      "tickets.read",
      "conversations.read",
      "conversations.write",
      "deposits.read",
      "notifications.read",
    ],
    isSystem: true,
  },
  {
    name: "Betika (lecture seule)",
    slug: "betika",
    description: "Partenaire Betika — consultation uniquement",
    adminRole: "BETIKA",
    permissions: ["dashboard.read", "analytics.read", "finance.read", "parieurs.read", "tickets.read", "deposits.read", "matches.read"],
    isSystem: true,
  },
];
