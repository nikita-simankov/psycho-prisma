// Reading Paddle webhooks: checking their signature and turning a subscription entity into our
// Subscription fields. Pure, so it is unit tested without Paddle.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "./plans";

// Paddle-Signature is "ts=<unix seconds>;h1=<hex HMAC-SHA256 of `${ts}:${raw body}`>".
// Signatures older than the tolerance are refused so a captured request can't be replayed later.
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, now = Date.now(), toleranceSeconds = 300) {
  if (!header || !secret) {
    return false;
  }
  const parts = Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...value] = part.split("=");
      return [key.trim(), value.join("=").trim()];
    })
  );
  const timestamp = Number(parts.ts);
  if (!parts.h1 || !Number.isFinite(timestamp) || Math.abs(now / 1000 - timestamp) > toleranceSeconds) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest();
  const given = Buffer.from(parts.h1, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// The parts of Paddle's subscription entity we use.
export type PaddleSubscription = {
  id: string;
  status: string;
  customer_id: string;
  updated_at?: string;
  custom_data?: { organizationId?: string } | null;
  items?: { price?: { id?: string; billing_cycle?: { interval?: string } | null } | null }[];
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  scheduled_change?: { action: string; effective_at: string } | null;
  canceled_at?: string | null;
};

export type SubscriptionUpdate = {
  plan: PlanId;
  status: string;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  priceId: string | null;
  interval: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  trialEndsAt: null;
  paddleUpdatedAt: Date | null;
};

const date = (value: string | null | undefined) => (value ? new Date(value) : null);

// What a Paddle subscription means for our Subscription row. Null when its price isn't one of ours.
export function subscriptionFromPaddle(data: PaddleSubscription, planForPrice: (priceId: string) => PlanId | null): SubscriptionUpdate | null {
  const price = data.items?.[0]?.price;
  const plan = price?.id ? planForPrice(price.id) : null;
  if (!plan) {
    return null;
  }
  const cancelling = data.scheduled_change?.action === "cancel";
  return {
    plan,
    // A Paddle trial is a paid plan starting later; for us it is simply active.
    status: data.status === "trialing" ? "active" : data.status,
    paddleSubscriptionId: data.id,
    paddleCustomerId: data.customer_id,
    priceId: price?.id ?? null,
    interval: price?.billing_cycle?.interval ?? null,
    currentPeriodStart: date(data.current_billing_period?.starts_at),
    // A cancelled subscription has no billing period left; keep the end we knew instead of clearing it.
    currentPeriodEnd: date(data.current_billing_period?.ends_at),
    cancelAt: cancelling ? date(data.scheduled_change?.effective_at) : null,
    trialEndsAt: null,
    paddleUpdatedAt: date(data.updated_at),
  };
}
