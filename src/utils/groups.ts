// Groups an admin can put a person in. The key is stored in User.group;
// labels live in the translation files under "groups".
export const USER_GROUPS = [
  "general",
  "monitoring",
  "risk",
  "suicide-risk",
  "substance-risk",
] as const;

export type UserGroup = (typeof USER_GROUPS)[number];

// Groups counted as "needs attention" on the dashboard.
export const RISK_GROUPS: readonly UserGroup[] = ["risk", "suicide-risk", "substance-risk"];

export function isUserGroup(value: string): value is UserGroup {
  return (USER_GROUPS as readonly string[]).includes(value);
}

// Badge and dot colours per group, from calm to urgent.
export const GROUP_STYLES: Record<UserGroup, { badge: string; dot: string }> = {
  general: { badge: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground" },
  monitoring: { badge: "bg-accent text-accent-foreground", dot: "bg-primary" },
  risk: { badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  "substance-risk": { badge: "bg-warning/15 text-warning", dot: "bg-warning" },
  "suicide-risk": { badge: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};
