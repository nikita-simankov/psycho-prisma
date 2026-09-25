import { logout } from "@/actions/auth/logout.action"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { getContext } from "@/utils/authentication"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { NewOrganizationForm } from "./new-organization-form"

export async function generateMetadata() {
  const t = await getTranslations("organizations.new")
  return { title: t("metaTitle") }
}

export default async function NewOrganizationPage() {
  const context = await getContext()

  if (!context) {
    redirect("/auth/sign-in")
  }

  const t = await getTranslations("organizations.new")
  const common = await getTranslations("common")
  const first = !context.membership

  return (
    <AuthShell title={t("title")} subtitle={first ? t("subtitleFirst") : t("subtitle")}>
      <NewOrganizationForm />
      {first && (
        <form action={logout}>
          <Button variant="ghost" className="w-full">
            {common("signOut")}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
