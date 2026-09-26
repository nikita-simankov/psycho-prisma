import { prisma } from "@/utils/database";
import { getTranslations } from "next-intl/server";
import { DismissButton } from "./dismiss-button";

const EXPLAINED = ["admin", "psychologist", "manager"] as const;

// For staff who were invited: what their role can do and what it can't see, until they close it.
export async function WelcomeCard({ membershipId, role, organization }: { membershipId: string; role: string; organization: string }) {
  const explained = EXPLAINED.find((r) => r === role);
  if (!explained) {
    return null;
  }
  const membership = await prisma.membership.findUnique({ where: { id: membershipId }, select: { welcomedAt: true } });
  if (!membership || membership.welcomedAt) {
    return null;
  }

  const t = await getTranslations("welcome");
  const roles = await getTranslations("roles");

  return (
    <section aria-labelledby="welcome-title" className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id="welcome-title" className="text-2xl font-medium">
          {t("title", { role: roles(explained), organization })}
        </h2>
        <DismissButton what="welcome" label={t("dismiss")} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("can")}</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {(["one", "two", "three"] as const).map((key) => (
              <li key={key}>{t(`${explained}.can.${key}`)}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("cannot")}</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {(["one", "two"] as const).map((key) => (
              <li key={key}>{t(`${explained}.cannot.${key}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
