import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

export async function generateMetadata() {
  const t = await getTranslations("verifyEmail")
  return { title: t("expiredTitle") }
}

export default async function VerificationExpiredPage() {
  const t = await getTranslations("verifyEmail")
  const common = await getTranslations("common")

  return (
    <AuthShell title={t("expiredTitle")} subtitle={t("expiredText")}>
      <Button asChild size="lg">
        <Link href="/auth/sign-in">{common("signIn")}</Link>
      </Button>
    </AuthShell>
  )
}
