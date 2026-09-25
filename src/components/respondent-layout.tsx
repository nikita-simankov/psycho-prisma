import { RespondentHeader } from "@/components/respondent-header";
import { ensureUser } from "@/utils/authentication";
import { redirect } from "next/navigation";

// Shared layout for /forms and /tests: respondents agree to the privacy notice first.
export async function RespondentLayout({ children }: { children: React.ReactNode }) {
  const user = await ensureUser();

  if (user.role !== "admin" && !user.consentedAt) {
    redirect("/consent");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <RespondentHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
