import { LocaleSwitcher } from "@/components/locale-switcher"
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
    <main className="relative min-h-dvh flex flex-col gap-4 items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {t("subtitle")}
        </p>
      </div>
      <SignUpForm />
      <div className="flex flex-row items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("haveAccount")}</span>
        <Link
          href="/auth/sign-in"
          className="font-medium underline underline-offset-2"
        >
          {t("signInLink")}
        </Link>
      </div>
    </main>
  )
}
