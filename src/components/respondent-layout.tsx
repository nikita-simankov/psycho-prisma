import { RespondentHeader } from "@/components/respondent-header";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { redirect } from "next/navigation";

// Shared layout for /forms and /tests: respondents agree to the privacy notice first.
export async function RespondentLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await ensureMember();

  if (!can(membership.role, "viewDashboard") && !membership.consentedAt) {
    redirect("/consent");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <RespondentHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
