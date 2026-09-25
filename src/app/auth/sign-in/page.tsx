import { LocaleSwitcher } from "@/components/locale-switcher"
import Logo from "@/components/ui/logo"
import { getTranslations } from "next-intl/server"
import SignInForm from "./components/sign-in-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.signIn")
  return { title: t("metaTitle") }
}

export default async function SignInPage() {
  const t = await getTranslations("auth.signIn")

  return (
    <main className="flex flex-row min-h-dvh">
      <div className="relative bg-background w-full lg:w-1/2 flex flex-col gap-6 items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <LocaleSwitcher />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {t("subtitle")}
          </p>
        </div>
        <SignInForm />
      </div>
      <div className="hidden lg:flex bg-accent w-1/2 flex-col items-center justify-center gap-4 px-8">
        <Logo withText />
        <p className="text-muted-foreground max-w-sm text-center">
          {t("aside")}
        </p>
      </div>
    </main>
  )
}
