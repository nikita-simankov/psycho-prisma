// Roles a person can hold in an organization, most powerful first.
// Candidates are people invited only for a hiring round; they see nothing but that round.
export const ROLES = ["owner", "admin", "psychologist", "manager", "member", "candidate"] as const;

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
  // Send assessment rounds and set up recurring ones.
  manageRounds: STAFF_ROLES,
  // Use the dashboard: people, results and reports.
  viewDashboard: STAFF_ROLES,
  // Open one person's answers and scores. HR managers see team averages instead.
  viewIndividualResults: ["owner", "admin", "psychologist"],
  // Results of clinical and wellbeing screens, and the restricted follow-up flag.
  viewSensitive: ["owner", "psychologist"],
  // Read the audit log of who opened or changed personal data.
  viewAudit: ["owner"],
  // Write and archive a person's conclusion.
  writeConclusions: ["owner", "psychologist"],
} satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// Roles an inviter may hand out: nobody can grant more than they have, and only owners create owners.
export function assignableRoles(role: string): Role[] {
  // Candidates are only added through hiring rounds.
  if (role === "owner") return ROLES.filter((r) => r !== "candidate");
  if (role === "admin") return ROLES.filter((r) => r !== "owner" && r !== "candidate");
  return [];
}
