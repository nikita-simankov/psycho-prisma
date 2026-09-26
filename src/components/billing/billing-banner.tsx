import { getSubscription } from "@/utils/billing";
import { billingNotice } from "@/utils/billing-rules";
import { can } from "@/utils/roles";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// A line above every staff page when the trial is ending or ended, or a payment failed. Shown to
// the people who can change the plan; everyone else carries on undisturbed.
export async function BillingBanner({ organizationId, role, base }: { organizationId: string; role: string; base: string }) {
  if (!can(role, "manageSettings")) {
    return null;
  }
  const notice = billingNotice(await getSubscription(organizationId));
  if (!notice) {
    return null;
  }
  const t = await getTranslations("billing.banner");
  const urgent = notice.kind === "pastDue" || notice.kind === "pastDueEnded";

  return (
    <div
      role="status"
      className={
        urgent
          ? "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-destructive/40 bg-card px-4 py-2 text-sm sm:px-6 lg:px-8 print:hidden"
          : "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-accent/50 px-4 py-2 text-sm sm:px-6 lg:px-8 print:hidden"
      }
    >
      <span>{"days" in notice ? t(notice.kind, { count: notice.days }) : t(notice.kind)}</span>
      <Link href={`${base}/settings/billing`} className="font-medium text-primary underline underline-offset-2">
        {t("action")}
      </Link>
    </div>
  );
}
