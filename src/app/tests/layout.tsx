import { RespondentHeader } from "@/components/respondent-header";
import { ensureUser } from "@/utils/authentication";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureUser();

  return (
    <div className="min-h-dvh flex flex-col">
      <RespondentHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
