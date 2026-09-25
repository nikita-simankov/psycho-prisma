import { PrivacyNotice } from "@/components/privacy-notice";
import { Card } from "@/components/ui/card";
import Logo from "@/components/ui/logo";
import { ensureUser } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ConsentActions } from "./consent-actions";

export async function generateMetadata() {
  const t = await getTranslations("consent");
  return { title: t("metaTitle") };
}

export default async function ConsentPage() {
  const user = await ensureUser();

  if (user.consentedAt || user.role === "admin") {
    redirect(user.role === "admin" ? "/dashboard" : "/forms");
  }

  const t = await getTranslations("consent");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-14">
      <Logo withText />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("text")}</p>
      </div>
      <Card className="p-5 sm:p-6">
        <PrivacyNotice />
      </Card>
      <ConsentActions />
    </main>
  );
}
