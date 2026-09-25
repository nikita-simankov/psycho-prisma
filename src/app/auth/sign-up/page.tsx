import { AuthShell } from "@/components/auth-shell"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import SignUpForm from "./components/sign-up-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.signUp")
  return { title: t("metaTitle") }
}

export default async function SignUpPage() {
  const t = await getTranslations("auth.signUp")

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <SignUpForm />
      <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">{t("invitedHint")}</p>
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </AuthShell>
  )
}
