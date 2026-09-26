import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export async function generateMetadata() {
  const t = await getTranslations("assessments.linkExpired");
  return { title: t("title") };
}

export default async function LinkExpiredPage() {
  const t = await getTranslations("assessments.linkExpired");

  return (
    <AuthShell title={t("title")} subtitle={t("text")}>
      <NewLinkForm />
      <p className="text-center text-sm text-muted-foreground">{t("or")}</p>
      <Button asChild variant="outline" className="w-full">
        <Link href="/auth/sign-in">{t("signIn")}</Link>
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href="/auth/forgot-password">{t("forgot")}</Link>
      </Button>
    </AuthShell>
  );
}
