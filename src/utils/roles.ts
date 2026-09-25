// Roles a person can hold in an organization, most powerful first.
export const ROLES = ["owner", "admin", "psychologist", "manager", "member"] as const;

export type Role = (typeof ROLES)[number];

// Roles that work in the dashboard; members only take assessments.
export const STAFF_ROLES: readonly Role[] = ["owner", "admin", "psychologist", "manager"];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

const PERMISSIONS = {
  // Invite, remove and change the role of people; create teams.
  manageMembers: ["owner", "admin"],
  // Organization name, privacy contact and respondent feedback.
  manageSettings: ["owner", "admin"],
  // Upload tests and questionnaires.
  manageLibrary: ["owner", "admin", "psychologist"],
  // Use the dashboard: people, results and reports.
  viewDashboard: STAFF_ROLES,
  // Results of clinical and wellbeing screens, and the restricted follow-up flag.
  viewSensitive: ["owner", "psychologist"],
  // Write and archive a person's conclusion.
  writeConclusions: ["owner", "psychologist"],
} satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// Roles an inviter may hand out: nobody can grant more than they have, and only owners create owners.
export function assignableRoles(role: string): Role[] {
  if (role === "owner") return [...ROLES];
  if (role === "admin") return ROLES.filter((r) => r !== "owner");
  return [];
}
