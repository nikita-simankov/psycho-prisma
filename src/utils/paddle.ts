import "server-only";

import type { PlanId } from "./plans";

// Paddle Billing. Everything is configured by environment variables, so the same build runs against
// the sandbox and the live account:
//   PADDLE_ENV              sandbox (default) or production
//   PADDLE_API_KEY          server API key
//   PADDLE_WEBHOOK_SECRET   secret of the notification destination pointing at /api/paddle/webhook
//   PADDLE_CLIENT_TOKEN     client-side token for Paddle.js (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN also works)
//   PADDLE_PRICE_TEAM       yearly price of the Team plan
//   PADDLE_PRICE_BUSINESS   yearly price of the Business plan
// Without them the app runs on local trials and Free, and the billing page says checkout isn't set up.

export function paddleConfig() {
  const environment: "sandbox" | "production" = process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
  return {
    environment,
    apiKey: process.env.PADDLE_API_KEY ?? "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
    clientToken: process.env.PADDLE_CLIENT_TOKEN ?? process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
    prices: {
      team: process.env.PADDLE_PRICE_TEAM ?? "",
      business: process.env.PADDLE_PRICE_BUSINESS ?? "",
    } as Partial<Record<PlanId, string>>,
  };
}

// Whether people can buy a plan here: Paddle.js needs the client token and a price for each plan.
export function checkoutReady() {
  const config = paddleConfig();
  return !!(config.clientToken && config.prices.team && config.prices.business);
}

export function planForPrice(priceId: string): PlanId | null {
  const { prices } = paddleConfig();
  const match = Object.entries(prices).find(([, id]) => id && id === priceId);
  return (match?.[0] as PlanId | undefined) ?? null;
}

export class PaddleError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "PaddleError";
  }
}

async function paddleApi<T>(path: string, init: { method: string; body?: unknown }): Promise<T> {
  const { environment, apiKey } = paddleConfig();
  if (!apiKey) {
    throw new PaddleError("PADDLE_API_KEY is not set", 0);
  }
  const base = environment === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
  const response = await fetch(`${base}${path}`, {
    method: init.method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new PaddleError(`Paddle ${init.method} ${path} failed: ${response.status} ${detail.slice(0, 300)}`, response.status);
  }
  return ((await response.json()) as { data: T }).data;
}

// A one-off link to Paddle's customer portal: payment method, invoices and cancellation.
export async function customerPortalUrl(customerId: string, subscriptionId: string | null) {
  const session = await paddleApi<{ urls: { general: { overview: string } } }>(`/customers/${customerId}/portal-sessions`, {
    method: "POST",
    body: subscriptionId ? { subscription_ids: [subscriptionId] } : {},
  });
  return session.urls.general.overview;
}

// Moves a subscription to another plan now, charging or crediting the difference.
export async function changeSubscriptionPrice(subscriptionId: string, priceId: string) {
  await paddleApi(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    body: { items: [{ price_id: priceId, quantity: 1 }], proration_billing_mode: "prorated_immediately" },
  });
}
