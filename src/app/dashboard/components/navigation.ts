import { FlaskConical, Home, NotepadText, Archive, FileText, Users, Layers } from "lucide-react";

// Admin sections. Labels live in the translation files under "dashboard.nav".
export const DASHBOARD_NAVIGATION = [
  { key: "home", href: "/dashboard", icon: Home },
  { key: "forms", href: "/dashboard/forms", icon: NotepadText },
  { key: "tests", href: "/dashboard/tests", icon: FlaskConical },
  { key: "people", href: "/dashboard/users", icon: Users },
  { key: "reports", href: "/dashboard/summary", icon: FileText },
  { key: "groups", href: "/dashboard/users/groups", icon: Layers },
  { key: "archive", href: "/dashboard/archive", icon: Archive },
] as const;
