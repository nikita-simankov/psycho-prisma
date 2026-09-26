import type { Permission } from "@/utils/roles";
import type { LucideIcon } from "lucide-react";
import { FileText, FlaskConical, Flag, Home, Layers, NotepadText, Send, Settings, Users } from "lucide-react";

// Sidebar sections, grouped as they appear, shown when the person's role has the permission.
// Paths are relative to the organization (/acme + path). Labels live under "dashboard.nav".
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  { key: "overview", items: [{ key: "home", path: "", icon: Home }] },
  {
    key: "assessments",
    items: [
      { key: "rounds", path: "/rounds", icon: Send, permission: "manageRounds" as const },
      { key: "forms", path: "/forms", icon: NotepadText },
      { key: "tests", path: "/tests", icon: FlaskConical },
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
    items: [{ key: "reports", path: "/reports", icon: FileText, permission: "viewIndividualResults" as const }],
  },
  {
    key: "organization",
    items: [{ key: "settings", path: "/settings", icon: Settings, permission: "manageSettings" as const }],
  },
];

export type NavigationKey = "home" | "rounds" | "forms" | "tests" | "people" | "teams" | "followUp" | "reports" | "settings";

export type NavigationItem = { key: NavigationKey; path: string; icon: LucideIcon; permission?: Permission };

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
