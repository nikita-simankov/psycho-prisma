import type { Permission } from "@/utils/roles";
import type { LucideIcon } from "lucide-react";
import { ChartColumn, FileText, Flag, Layers, LibraryBig, Send, Settings, Sun, Users } from "lucide-react";

// Sidebar sections, grouped as they appear, shown when the person's role has the permission.
// Paths are relative to the organization (/acme + path). Labels live under "dashboard.nav".
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  { key: "overview", items: [{ key: "home", path: "", icon: Sun }] },
  {
    key: "assessments",
    items: [
      { key: "rounds", path: "/rounds", icon: Send, permission: "manageRounds" as const },
      // Tests and questionnaires share one Library entry; its pages switch between them with tabs.
      { key: "library", path: "/tests", icon: LibraryBig, alsoMatches: ["/forms"] },
    ],
  },
  {
    key: "people",
    items: [
      { key: "people", path: "/people", icon: Users },
      { key: "teams", path: "/people/teams", icon: Layers },
      { key: "followUp", path: "/people/follow-up", icon: Flag, permission: "viewSensitive" as const },
    ],
  },
  {
    key: "reports",
    items: [
      { key: "analytics", path: "/analytics", icon: ChartColumn },
      { key: "reports", path: "/reports", icon: FileText, permission: "viewIndividualResults" as const },
    ],
  },
  {
    key: "organization",
    items: [{ key: "settings", path: "/settings", icon: Settings, permission: "manageSettings" as const }],
  },
];

export type NavigationKey = "home" | "rounds" | "library" | "people" | "teams" | "followUp" | "analytics" | "reports" | "settings";

export type NavigationItem = {
  key: NavigationKey;
  path: string;
  icon: LucideIcon;
  permission?: Permission;
  // Other paths that belong to this entry, so it stays highlighted on them.
  alsoMatches?: string[];
};

export type NavigationGroup = {
  key: "overview" | "assessments" | "people" | "reports" | "organization";
  items: NavigationItem[];
};

export const NAVIGATION: NavigationItem[] = NAVIGATION_GROUPS.flatMap((group) => group.items);

// The sections a role can open, in sidebar order.
export function visibleGroups(canOpen: (permission: Permission) => boolean): NavigationGroup[] {
  return NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || canOpen(item.permission)),
  })).filter((group) => group.items.length > 0);
}
