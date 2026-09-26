import { ChangePlanButton, CheckoutButton, PortalButton, type CheckoutSettings } from "@/components/billing/billing-buttons";
import { Section } from "@/components/page-templates";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Stat } from "@/components/ui/stat";
import { ensureMember } from "@/utils/authentication";
import { getUsage } from "@/utils/billing";
import { billingNotice, planById, trialDaysLeft } from "@/utils/billing-rules";
import { absoluteUrl } from "@/utils/mail";
import { organizationBase } from "@/utils/organization-path";
import { checkoutReady, paddleConfig } from "@/utils/paddle";
import { PLAN_CURRENCY, PLANS, type Plan } from "@/utils/plans";
import { cn } from "@/utils/utils";
import { getFormatter, getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("settings.sections");
  return { title: t("billing") };
}

// Plan and billing: the plan in force, usage against its limits, and buying or changing a plan
// through Paddle. Invoices, payment details and cancelling are in Paddle's customer portal.
export default async function BillingPage(props: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await props.searchParams;
  const t = await getTranslations("settings.billing");
  const pricing = await getTranslations("pricing");
  const format = await getFormatter();
  const { organization, user } = await ensureMember("manageSettings");
  const { subscription, plan, respondents, seats, since } = await getUsage(organization.id);
  const current = planById(plan);
  const notice = billingNotice(subscription);
  const trialDays = trialDaysLeft(subscription);
  const config = paddleConfig();
  const ready = checkoutReady();
  const paying = !!subscription.paddleSubscriptionId && ["active", "past_due"].includes(subscription.status);
  const date = (value: Date) => format.dateTime(value, { day: "numeric", month: "long", year: "numeric" });

  const status =
    trialDays !== null && trialDays > 0
      ? t("status.trial", { plan: pricing(`plans.${subscription.plan}.name`), count: trialDays })
      : subscription.status === "past_due" && notice?.kind === "pastDue"
        ? t("status.pastDue", { count: notice.days })
        : subscription.cancelAt
          ? t("status.cancels", { date: date(subscription.cancelAt) })
          : paying && subscription.currentPeriodEnd
            ? t("status.renews", { date: date(subscription.currentPeriodEnd) })
            : plan === "free"
              ? t("status.free")
              : "";

  const checkoutSettings: CheckoutSettings = {
    token: config.clientToken,
    environment: config.environment,
    email: user.email ?? "",
    organizationId: organization.id,
    successUrl: await absoluteUrl(`${await organizationBase()}/settings/billing?checkout=done`),
  };

  const price = (entry: Plan) =>
    entry.monthlyPrice === null
      ? pricing("custom")
      : entry.monthlyPrice === 0
        ? pricing("free")
        : format.number(entry.monthlyPrice, { style: "currency", currency: PLAN_CURRENCY, maximumFractionDigits: 0 });

  const action = (entry: Plan) => {
    const name = pricing(`plans.${entry.id}.name`);
    if (entry.id === "enterprise") {
      return (
        <Button variant="outline" asChild>
          <a href="mailto:sales@calibre.example">{pricing("plans.enterprise.cta")}</a>
        </Button>
      );
    }
    if (entry.id === "free") {
      return null;
    }
    if (paying && subscription.plan === entry.id) {
      return <p className="text-sm font-medium">{t("currentPlan")}</p>;
    }
    const priceId = config.prices[entry.id];
    if (!ready || !priceId) {
      return (
        <Button variant="outline" disabled>
          {t("choose", { plan: name })}
        </Button>
      );
    }
    return paying ? (
      <ChangePlanButton plan={entry.id} planName={name} label={t("switch", { plan: name })} />
    ) : (
      <CheckoutButton settings={checkoutSettings} priceId={priceId} label={t("choose", { plan: name })} primary={entry.id === "business"} />
    );
  };

  const meter = (used: number, limit: number | null) =>
    limit === null ? null : (
      <div className="mt-3 h-1.5 w-full bg-muted" aria-hidden>
        <div
          className={cn("h-full", used > limit ? "bg-destructive" : used >= limit * 0.8 ? "bg-warning" : "bg-primary")}
          style={{ width: `${Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))}%` }}
        />
      </div>
    );

  return (
    <div className="flex max-w-3xl flex-col gap-12">
      {checkout === "done" && (
        <p role="status" className="border-l-2 border-success bg-card px-4 py-3 text-sm">
          {t("thanks")}
        </p>
      )}
      <Section title={t("plan")} description={status || undefined}>
        <div className="grid border-y sm:grid-cols-3">
          <div className="py-5 sm:pr-5">
            <Stat label={t("current")} value={pricing(`plans.${plan}.name`)} hint={trialDays ? t("trialHint") : price(current) + (current.monthlyPrice ? ` ${pricing("perMonth")}` : "")} />
          </div>
          <div className="border-t py-5 sm:border-l sm:border-t-0 sm:px-5">
            <Stat
              label={t("respondents")}
              value={current.respondentsPerYear === null ? respondents : `${respondents} / ${format.number(current.respondentsPerYear)}`}
              hint={t("respondentsSince", { date: date(since) })}
              tone={current.respondentsPerYear !== null && respondents > current.respondentsPerYear ? "negative" : "neutral"}
            />
            {meter(respondents, current.respondentsPerYear)}
          </div>
          <div className="border-t py-5 sm:border-l sm:border-t-0 sm:pl-5">
            <Stat
              label={t("seats")}
              value={current.staffSeats === null ? seats : `${seats} / ${current.staffSeats}`}
              hint={t("seatsHint")}
              tone={current.staffSeats !== null && seats > current.staffSeats ? "negative" : "neutral"}
            />
            {meter(seats, current.staffSeats)}
          </div>
        </div>
        {!ready && <p className="text-sm text-muted-foreground">{t("notConfigured")}</p>}
      </Section>

      <Section title={t("plans")} description={t("plansText")}>
        <ul className="grid border-y sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "flex flex-col gap-3 border-b p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0",
                entry.id === plan && "bg-accent/50"
              )}
            >
              <Eyebrow>{pricing(`plans.${entry.id}.name`)}</Eyebrow>
              <p className="font-heading text-2xl font-medium" data-numeric>
                {price(entry)}
              </p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                <li>
                  {entry.respondentsPerYear === null
                    ? pricing("unlimitedRespondents")
                    : pricing("respondents", { count: format.number(entry.respondentsPerYear) })}
                </li>
                <li>{entry.staffSeats === null ? pricing("unlimitedSeats") : pricing("seats", { count: entry.staffSeats })}</li>
              </ul>
              <div className="mt-auto pt-2">{action(entry)}</div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{pricing("note")}</p>
      </Section>

      <Section title={t("invoices")} description={t("invoicesText")}>
        {subscription.paddleCustomerId ? (
          <div>
            <PortalButton />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("invoicesEmpty")}</p>
        )}
      </Section>
    </div>
  );
}
