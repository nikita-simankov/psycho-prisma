"use client";

import { SettingsLayout } from "@/components/page-templates";
import { usePathname } from "next/navigation";

// The settings section links, with the one being viewed marked.
export function SettingsNav({
  sections,
  label,
  children,
}: {
  sections: { href: string; label: string }[];
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The longest matching link wins, so /settings/audit marks Audit rather than General.
  const current = sections
    .filter((section) => pathname === section.href || pathname.startsWith(section.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <SettingsLayout sections={sections} current={current ?? ""} label={label}>
      {children}
    </SettingsLayout>
  );
}
