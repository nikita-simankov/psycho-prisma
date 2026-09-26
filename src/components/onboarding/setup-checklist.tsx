import { Eyebrow } from "@/components/ui/eyebrow";
import { prisma } from "@/utils/database";
import { SETUP_STEPS, setupProgress, type SetupStep } from "@/utils/onboarding";
import { cn } from "@/utils/utils";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { DismissButton } from "./dismiss-button";

type Properties = {
  organization: { id: string; slug: string; privacyContact: string };
  user: { id: string; emailVerifiedAt: Date | null };
};

// The first things to do in a new organization. Each step ticks itself off from real work;
// the card goes away when everything is done or an admin closes it.
export async function SetupChecklist({ organization, user }: Properties) {
  const settings = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    select: { setupDismissedAt: true, isSample: true, goal: true },
  });
  if (settings.setupDismissedAt || settings.isSample) {
    return null;
  }

  const progress = await setupProgress(organization, user);
  const done = SETUP_STEPS.filter((step) => progress[step]).length;
  if (done === SETUP_STEPS.length) {
    return null;
  }

  const t = await getTranslations("setup");
  const base = `/${organization.slug}`;
  const links: Record<SetupStep, string | null> = {
    confirmEmail: null,
    tryYourself: "/start",
    privacyContact: `${base}/settings/privacy`,
    inviteColleague: `${base}/settings/members`,
    addPeople: `${base}/people`,
    sendRound: `${base}/rounds/new`,
  };

  return (
    <section aria-labelledby="setup-title" className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Eyebrow>{t("eyebrow", { done, total: SETUP_STEPS.length })}</Eyebrow>
          <h2 id="setup-title" className="text-2xl font-medium">
            {t("title")}
          </h2>
        </div>
        <DismissButton what="setup" label={t("dismiss")} />
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={SETUP_STEPS.length}
        aria-valuenow={done}
        aria-label={t("progress")}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / SETUP_STEPS.length) * 100}%` }} />
      </div>
      <ul className="flex flex-col">
        {SETUP_STEPS.map((step) => {
          const complete = progress[step];
          const href = links[step];
          return (
            <li key={step} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-3 border-t py-3 first:border-t-0">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border",
                  complete ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
                aria-hidden
              >
                {complete && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex flex-col">
                <span className={cn("text-sm font-medium", complete && "text-muted-foreground line-through")}>
                  {t(`steps.${step}.label`)}
                  <span className="sr-only">{complete ? t("done") : t("todo")}</span>
                </span>
                {!complete && <span className="text-sm text-muted-foreground">{t(`steps.${step}.text`)}</span>}
              </span>
              {!complete && href && (
                <Link href={href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {t(`steps.${step}.action`)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
