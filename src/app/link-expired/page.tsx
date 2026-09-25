import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getTranslations("assessments.linkExpired");
  return { title: t("title") };
}

export default async function LinkExpiredPage() {
  const t = await getTranslations("assessments.linkExpired");

  return (
    <AuthShell title={t("title")} subtitle={t("text")}>
      <Button asChild className="w-full">
        <Link href="/auth/sign-in">{t("signIn")}</Link>
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/auth/forgot-password">{t("forgot")}</Link>
      </Button>
    </AuthShell>
  );
}
