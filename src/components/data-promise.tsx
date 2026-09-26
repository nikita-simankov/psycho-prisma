import { prisma } from "@/utils/database";
import { MIN_GROUP } from "@/utils/results";
import { Eye, Lock, Timer, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

// What happens to a respondent's answers, from the organization's own settings.
export async function DataPromise({ organizationId }: { organizationId: string }) {
  const t = await getTranslations("respondent.promise");
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { name: true, retentionMonths: true, respondentFeedback: true, privacyContact: true },
  });
  const rows = [
    { icon: Eye, text: t("access", { organization: organization.name }) },
    { icon: Lock, text: t("managers", { count: MIN_GROUP }) },
    {
      icon: Timer,
      text: organization.retentionMonths ? t("retention", { count: organization.retentionMonths }) : t("retentionKept", { organization: organization.name }),
    },
    ...(organization.respondentFeedback ? [{ icon: UserRound, text: t("ownResults") }] : []),
  ];

  return (
    <section aria-labelledby="promise-heading" className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:p-5">
      <h2 id="promise-heading" className="font-sans text-sm font-medium">
        {t("title")}
      </h2>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {rows.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2">
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      {organization.privacyContact && <p className="text-xs text-muted-foreground">{t("contact", { contact: organization.privacyContact })}</p>}
    </section>
  );
}
