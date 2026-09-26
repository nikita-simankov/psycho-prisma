// The rules that turn a subscription into what an organization may do. Pure functions, so they are
// unit tested; src/utils/billing.ts applies them to the database.
import { PLAN_FEATURES, PLANS, type FeatureLevel, type Plan, type PlanId } from "./plans";

export const TRIAL_DAYS = 14;
// Organizations that existed before billing launched get this long on Business (migration 1_billing).
export const GRANDFATHER_DAYS = 90;
// How long a failed payment keeps the paid plan working before the organization drops to Free.
export const PAST_DUE_GRACE_DAYS = 14;
// Respondents may go this far over the plan's limit before new rounds are refused.
export const RESPONDENT_GRACE = 0.1;
// Trial and past-due notices start this many days before the change.
export const NOTICE_DAYS = 3;

const DAY = 86_400_000;

export type SubscriptionState = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  interval: string | null;
  pastDueSince: Date | null;
  cancelAt: Date | null;
};

export type FeatureKey = (typeof PLAN_FEATURES)[number]["key"];

export function isPlanId(value: string): value is PlanId {
  return PLANS.some((plan) => plan.id === value);
}

export function planById(id: PlanId): Plan {
  return PLANS.find((plan) => plan.id === id)!;
}

// The plan whose limits apply right now.
export function effectivePlan(subscription: SubscriptionState | null, now = new Date()): PlanId {
  if (!subscription || !isPlanId(subscription.plan)) {
    return "free";
  }
  const plan = subscription.plan;

  switch (subscription.status) {
    case "trialing":
      return subscription.trialEndsAt && subscription.trialEndsAt > now ? plan : "free";
    case "active":
      return plan;
    case "past_due": {
      const since = subscription.pastDueSince ?? now;
      return now.getTime() - since.getTime() < PAST_DUE_GRACE_DAYS * DAY ? plan : "free";
    }
    case "canceled":
      // A plan cancelled at the end of its period stays in force until then.
      return subscription.currentPeriodEnd && subscription.currentPeriodEnd > now ? plan : "free";
    default:
      return "free";
  }
}

export function featureLevel(plan: PlanId, feature: FeatureKey): FeatureLevel {
  return PLAN_FEATURES.find((entry) => entry.key === feature)?.levels[plan] ?? false;
}

export function hasFeature(plan: PlanId, feature: FeatureKey): boolean {
  return featureLevel(plan, feature) !== false;
}

// The most respondents a plan allows before new rounds are refused, grace included. Null is unlimited.
export function respondentAllowance(plan: PlanId): number | null {
  const limit = planById(plan).respondentsPerYear;
  return limit === null ? null : Math.floor(limit * (1 + RESPONDENT_GRACE));
}

// Respondents are counted from the start of a yearly billing period, otherwise over the last twelve months.
export function usagePeriodStart(subscription: SubscriptionState | null, now = new Date()): Date {
  if (
    subscription?.interval === "year" &&
    subscription.currentPeriodStart &&
    subscription.currentPeriodStart <= now &&
    effectivePlan(subscription, now) !== "free"
  ) {
    return subscription.currentPeriodStart;
  }
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  return start;
}

export type BillingNotice =
  | { kind: "trialEnding"; days: number }
  | { kind: "trialEnded" }
  | { kind: "pastDue"; days: number }
  | { kind: "pastDueEnded" };

// What owners and admins should be told about the plan, if anything.
export function billingNotice(subscription: SubscriptionState | null, now = new Date()): BillingNotice | null {
  if (!subscription) {
    return null;
  }
  if (subscription.status === "trialing" && subscription.trialEndsAt) {
    const days = Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / DAY);
    if (days <= 0) return { kind: "trialEnded" };
    if (days <= NOTICE_DAYS) return { kind: "trialEnding", days };
  }
  if (subscription.status === "past_due") {
    const since = subscription.pastDueSince ?? now;
    const days = PAST_DUE_GRACE_DAYS - Math.floor((now.getTime() - since.getTime()) / DAY);
    return days > 0 ? { kind: "pastDue", days } : { kind: "pastDueEnded" };
  }
  return null;
}

// Days left in a trial, or null when the subscription isn't trialing.
export function trialDaysLeft(subscription: SubscriptionState | null, now = new Date()): number | null {
  if (subscription?.status !== "trialing" || !subscription.trialEndsAt) {
    return null;
  }
  return Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / DAY));
}
