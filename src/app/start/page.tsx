import { findAllTests } from "@/actions/test/find-all-tests-action"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import Logo from "@/components/ui/logo"
import { ensureMember } from "@/utils/authentication"
import { prisma } from "@/utils/database"
import { GOALS, isGoal, SUGGESTED_TESTS, testMinutes } from "@/utils/onboarding"
import { assignableRoles, STAFF_ROLES } from "@/utils/roles"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { StartWizard, type Suggestion } from "./start-wizard"

export async function generateMetadata() {
  const t = await getTranslations("start")
  return { title: t("metaTitle") }
}

// The welcome after sign-up: what Calibre is for here, a few colleagues, and a first look.
export default async function StartPage() {
  const { organization, membership, user } = await ensureMember("manageSettings")
  const t = await getTranslations("start")
  const [tests, settings] = await Promise.all([
    findAllTests(),
    prisma.organization.findUniqueOrThrow({ where: { id: organization.id }, select: { goal: true, teamSize: true } }),
  ])
  const byId = new Map(tests.map((test) => [test.id, test]))
  const suggestions = Object.fromEntries(
    GOALS.map((goal) => [
      goal,
      SUGGESTED_TESTS[goal]
        .map((id) => byId.get(id))
        .filter((test) => !!test)
        .map((test): Suggestion => ({ id: test.id, name: test.name, sensitive: test.sensitive, minutes: testMinutes(test.id) })),
    ])
  ) as Record<(typeof GOALS)[number], Suggestion[]>
  const staffRoles = assignableRoles(membership.role).filter((role) => STAFF_ROLES.includes(role) && role !== "owner")

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Logo withText />
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href={`/${organization.slug}`} className="ml-2 text-sm text-muted-foreground underline-offset-4 hover:underline">
            {t("skip")}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pb-16 pt-6 sm:px-6">
        <StartWizard
          organization={{ slug: organization.slug, name: organization.name }}
          firstName={user.name}
          verified={!!user.emailVerifiedAt}
          initialGoal={isGoal(settings.goal) ? settings.goal : "development"}
          initialTeamSize={settings.teamSize || "51-200"}
          suggestions={suggestions}
          roles={staffRoles}
        />
      </main>
    </div>
  )
}
