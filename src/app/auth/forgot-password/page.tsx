import { AuthShell } from "@/components/auth-shell"
import { getTranslations } from "next-intl/server"
import { ForgotPasswordForm } from "./forgot-password-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.forgot")
  return { title: t("metaTitle") }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgot")

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
