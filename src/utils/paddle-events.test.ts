import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { subscriptionFromPaddle, verifyPaddleSignature } from "./paddle-events";

const secret = "pdl_ntfset_test_secret";
const body = JSON.stringify({ event_id: "evt_1", event_type: "subscription.created" });
const now = 1_790_000_000_000;
const sign = (ts: number, payload = body) => `ts=${ts};h1=${createHmac("sha256", secret).update(`${ts}:${payload}`).digest("hex")}`;

describe("verifyPaddleSignature", () => {
  it("accepts a fresh, correct signature", () => {
    expect(verifyPaddleSignature(body, sign(now / 1000), secret, now)).toBe(true);
  });

  it("refuses a changed body, a wrong secret, an old signature or no header", () => {
    expect(verifyPaddleSignature(`${body} `, sign(now / 1000), secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, sign(now / 1000), "other", now)).toBe(false);
    expect(verifyPaddleSignature(body, sign(now / 1000 - 600), secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, null, secret, now)).toBe(false);
    expect(verifyPaddleSignature(body, "ts=abc;h1=zz", secret, now)).toBe(false);
  });
});

describe("subscriptionFromPaddle", () => {
  const planForPrice = (id: string) => (id === "pri_team" ? "team" : null);
  const entity = {
    id: "sub_1",
    status: "active",
    customer_id: "ctm_1",
    updated_at: "2026-09-26T12:00:00Z",
    custom_data: { organizationId: "org_1" },
    items: [{ price: { id: "pri_team", billing_cycle: { interval: "year" } } }],
    current_billing_period: { starts_at: "2026-09-26T12:00:00Z", ends_at: "2027-09-26T12:00:00Z" },
    scheduled_change: null,
  };

  it("maps the price to a plan and copies the period", () => {
    expect(subscriptionFromPaddle(entity, planForPrice)).toMatchObject({
      plan: "team",
      status: "active",
      interval: "year",
      paddleSubscriptionId: "sub_1",
      paddleCustomerId: "ctm_1",
      currentPeriodEnd: new Date("2027-09-26T12:00:00Z"),
      cancelAt: null,
    });
  });

  it("records a scheduled cancellation", () => {
    const update = subscriptionFromPaddle(
      { ...entity, scheduled_change: { action: "cancel", effective_at: "2027-09-26T12:00:00Z" } },
      planForPrice
    );
    expect(update?.cancelAt).toEqual(new Date("2027-09-26T12:00:00Z"));
  });

  it("ignores prices that aren't ours", () => {
    expect(subscriptionFromPaddle({ ...entity, items: [{ price: { id: "pri_other" } }] }, planForPrice)).toBeNull();
  });
});
