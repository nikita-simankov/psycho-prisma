import { AuthShell } from "@/components/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { safeNext } from "@/utils/oauth"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import SignInForm from "./components/sign-in-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.signIn")
  return { title: t("metaTitle") }
}

export default async function SignInPage(props: { searchParams: Promise<{ reason?: string; verified?: string; next?: string }> }) {
  const { reason, verified, next } = await props.searchParams
  const t = await getTranslations("auth.signIn")
  // A round link only opens assessments; the dashboard and account need the password.
  const subtitle =
    reason === "link"
      ? t("linkSession")
      : reason === "oauthExisting"
        ? t("oauthExisting")
        : reason === "oauthFailed"
          ? t("oauthFailed")
          : verified
            ? t("verified")
            : t("subtitle")

  return (
    <AuthShell title={t("title")} subtitle={subtitle}>
      <OAuthButtons next={safeNext(next) ?? undefined} />
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  )
}
