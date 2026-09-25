import { AuthShell } from "@/components/auth-shell"
import { getTranslations } from "next-intl/server"
import SignInForm from "./components/sign-in-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.signIn")
  return { title: t("metaTitle") }
}

export default async function SignInPage() {
  const t = await getTranslations("auth.signIn")

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <SignInForm />
    </AuthShell>
  )
}
