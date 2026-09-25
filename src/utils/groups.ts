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
