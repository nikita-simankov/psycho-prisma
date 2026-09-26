import { AuthShell } from "@/components/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { enabledProviders } from "@/utils/oauth"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import SignUpForm from "./components/sign-up-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.signUp")
  return { title: t("metaTitle") }
}

export default async function SignUpPage() {
  const t = await getTranslations("auth.signUp")
  const oauth = await getTranslations("auth.oauth")

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      {enabledProviders().length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-xs text-muted-foreground">{oauth("signUpTerms")}</p>
          <OAuthButtons />
        </div>
      )}
      <SignUpForm />
      <p className="border-l-2 py-1 pl-3 text-sm text-muted-foreground">{t("invitedHint")}</p>
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </AuthShell>
  )
}
