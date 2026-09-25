import type { Permission } from "@/utils/roles";
import { Archive, FileText, FlaskConical, Flag, Home, Layers, NotepadText, Settings, Users } from "lucide-react";

// Dashboard sections, shown when the person's role has the permission.
// Labels live in the translation files under "dashboard.nav".
export const DASHBOARD_NAVIGATION = [
  { key: "home", href: "/dashboard", icon: Home },
  { key: "forms", href: "/dashboard/forms", icon: NotepadText },
  { key: "tests", href: "/dashboard/tests", icon: FlaskConical },
  { key: "people", href: "/dashboard/users", icon: Users },
  { key: "teams", href: "/dashboard/users/teams", icon: Layers },
  { key: "followUp", href: "/dashboard/users/follow-up", icon: Flag, permission: "viewSensitive" },
  { key: "reports", href: "/dashboard/summary", icon: FileText },
  { key: "archive", href: "/dashboard/archive", icon: Archive },
  { key: "settings", href: "/dashboard/settings", icon: Settings, permission: "manageSettings" },
] as const satisfies readonly { key: string; href: string; icon: unknown; permission?: Permission }[];
