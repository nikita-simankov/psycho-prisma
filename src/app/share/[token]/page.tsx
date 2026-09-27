import PrintButton from "@/app/[org]/components/print-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PrintExpander } from "@/components/results/print-expander";
import { TestResultSection } from "@/components/results/test-result-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eyebrow } from "@/components/ui/eyebrow";
import Logo from "@/components/ui/logo";
import { audit } from "@/utils/audit";
import { prisma } from "@/utils/database";
import { shareableResults } from "@/utils/hiring";
import { checkShareCode, SHARE_COOKIE, shareState } from "@/utils/share-links";
import { hashToken } from "@/utils/tokens";
import { formatFullName } from "@/utils/user";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { CodeForm } from "./code-form";

type PathParams = { params: Promise<{ token: string }> };

// Never indexed, and the address (which carries the token) is never sent on as a referrer.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hiring.shared");
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8 print:hidden">
        <Logo withText />
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}

// One candidate's report, read-only, for someone without an account: the link and a 6-digit code
// open it until it expires or is revoked. Every view is written to the organization's audit log.
export default async function SharedReportPage(props: PathParams) {
  const { token } = await props.params;
  const t = await getTranslations("hiring.shared");
  const report = await getTranslations("report");
  const format = await getFormatter();
  const share = /^[\w-]{20,100}$/.test(token) ? await prisma.reportShare.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  const state = share ? shareState(share) : null;

  if (!share || state === "expired" || state === "revoked") {
    return (
      <Shell>
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-medium">{t("unavailableTitle")}</h1>
          <p className="text-muted-foreground">{t("unavailableText")}</p>
        </div>
      </Shell>
    );
  }

  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: share.organizationId }, select: { name: true } });
  // The code saved in this browser by a correct entry; checked, and counted when wrong, like a typed one.
  const saved = (await cookies()).get(SHARE_COOKIE)?.value;
  const check = saved ? checkShareCode(share, saved) : null;
  if (check?.update) {
    await prisma.reportShare.update({ where: { id: share.id }, data: check.update });
  }

  if (check?.outcome !== "ok") {
    return (
      <Shell>
        <div className="flex max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="text-3xl font-medium">{t("codeTitle")}</h1>
            <p className="text-muted-foreground">{t("codeText", { organization: organization.name })}</p>
          </div>
          <CodeForm token={token} locked={state === "locked" || check?.outcome === "locked"} />
        </div>
      </Shell>
    );
  }

  const [user, summary, results] = await Promise.all([
    prisma.user.findUnique({ where: { id: share.userId }, select: { name: true, middleName: true, lastName: true } }),
    share.includeConclusion
      ? prisma.userSummary.findUnique({ where: { userId_organizationId: { userId: share.userId, organizationId: share.organizationId } } })
      : null,
    shareableResults(share.organizationId, share.userId, await getLocale(), JSON.parse(share.submissionIds) as string[]),
  ]);

  await prisma.reportShare.update({ where: { id: share.id }, data: { views: { increment: 1 }, lastViewedAt: new Date() } });
  await audit(share.organizationId, null, "viewSharedReport", { subjectId: share.userId, detail: { shareId: share.id, recipient: share.recipient || null } });

  return (
    <Shell>
      <PrintExpander />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Eyebrow>{t("from", { organization: organization.name })}</Eyebrow>
          <h1 className="text-3xl font-medium leading-tight sm:text-4xl">{user ? formatFullName(user) : t("formerCandidate")}</h1>
          <p className="text-sm text-muted-foreground">{t("expires", { date: format.dateTime(share.expiresAt, { dateStyle: "long" }) })}</p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>
      <p className="border-y py-3 text-sm text-muted-foreground">{t("confidential")}</p>
      {results.map((result) => (
        <TestResultSection key={result.id} result={result} showAnswers={false} />
      ))}
      {share.includeConclusion && (
        <section className="flex flex-col gap-3 border-t border-foreground/80 pt-5 print:border-gray-800">
          <h2 className="text-2xl font-medium">{report("conclusion")}</h2>
          <p className="max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-relaxed">
            {summary?.verdict || <span className="text-muted-foreground">{report("empty")}</span>}
          </p>
        </section>
      )}
    </Shell>
  );
}
