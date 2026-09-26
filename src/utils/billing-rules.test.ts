import { describe, expect, it } from "vitest";
import {
  billingNotice,
  effectivePlan,
  hasFeature,
  respondentAllowance,
  trialDaysLeft,
  usagePeriodStart,
  type SubscriptionState,
} from "./billing-rules";

const now = new Date("2026-09-26T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
const base: SubscriptionState = {
  plan: "business",
  status: "trialing",
  trialEndsAt: days(10),
  currentPeriodStart: null,
  currentPeriodEnd: null,
  interval: null,
  pastDueSince: null,
  cancelAt: null,
};

describe("effectivePlan", () => {
  it("gives the trial plan until the trial ends, then Free", () => {
    expect(effectivePlan(base, now)).toBe("business");
    expect(effectivePlan({ ...base, trialEndsAt: days(-1) }, now)).toBe("free");
  });

  it("keeps a past-due plan for the grace period only", () => {
    const pastDue = { ...base, plan: "team", status: "past_due" };
    expect(effectivePlan({ ...pastDue, pastDueSince: days(-13) }, now)).toBe("team");
    expect(effectivePlan({ ...pastDue, pastDueSince: days(-15) }, now)).toBe("free");
  });

  it("keeps a cancelled plan to the end of its paid period", () => {
    const canceled = { ...base, plan: "team", status: "canceled" };
    expect(effectivePlan({ ...canceled, currentPeriodEnd: days(5) }, now)).toBe("team");
    expect(effectivePlan({ ...canceled, currentPeriodEnd: days(-1) }, now)).toBe("free");
  });

  it("treats paused, unknown and missing subscriptions as Free", () => {
    expect(effectivePlan({ ...base, status: "paused" }, now)).toBe("free");
    expect(effectivePlan({ ...base, status: "active", plan: "gold" }, now)).toBe("free");
    expect(effectivePlan(null, now)).toBe("free");
  });
});

describe("plans", () => {
  it("unlock features by tier", () => {
    expect(hasFeature("free", "schedules")).toBe(false);
    expect(hasFeature("team", "schedules")).toBe(true);
    expect(hasFeature("team", "clinical")).toBe(false);
    expect(hasFeature("business", "clinical")).toBe(true);
    expect(hasFeature("team", "studio")).toBe(true);
  });

  it("allow ten percent over the respondent limit", () => {
    expect(respondentAllowance("free")).toBe(27);
    expect(respondentAllowance("team")).toBe(275);
    expect(respondentAllowance("enterprise")).toBeNull();
  });
});

describe("usagePeriodStart", () => {
  it("uses a yearly period's start, otherwise the last twelve months", () => {
    const yearly = { ...base, status: "active", interval: "year", currentPeriodStart: days(-30), currentPeriodEnd: days(335) };
    expect(usagePeriodStart(yearly, now)).toEqual(days(-30));
    expect(usagePeriodStart(base, now).toISOString()).toBe("2025-09-26T12:00:00.000Z");
  });
});

describe("billingNotice", () => {
  it("warns before a trial ends and after", () => {
    expect(billingNotice(base, now)).toBeNull();
    expect(billingNotice({ ...base, trialEndsAt: days(2) }, now)).toEqual({ kind: "trialEnding", days: 2 });
    expect(billingNotice({ ...base, trialEndsAt: days(-1) }, now)).toEqual({ kind: "trialEnded" });
    expect(trialDaysLeft({ ...base, trialEndsAt: days(-1) }, now)).toBe(0);
  });

  it("counts down a failed payment's grace period", () => {
    const pastDue = { ...base, status: "past_due", pastDueSince: days(-4) };
    expect(billingNotice(pastDue, now)).toEqual({ kind: "pastDue", days: 10 });
    expect(billingNotice({ ...pastDue, pastDueSince: days(-20) }, now)).toEqual({ kind: "pastDueEnded" });
  });
});
