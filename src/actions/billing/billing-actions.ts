"use server";

import { requireMember } from "@/utils/authentication";
import { getSubscription } from "@/utils/billing";
import { isPlanId } from "@/utils/billing-rules";
import { changeSubscriptionPrice, customerPortalUrl, paddleConfig, PaddleError } from "@/utils/paddle";
import { z } from "zod";

// A link to Paddle's customer portal for this organization: payment method, invoices, cancelling.
export async function openCustomerPortal(): Promise<{ url: string } | { error: "noCustomer" | "unavailable" }> {
  const { organization } = await requireMember("manageSettings");
  const subscription = await getSubscription(organization.id);
  if (!subscription.paddleCustomerId) {
    return { error: "noCustomer" };
  }
  try {
    return { url: await customerPortalUrl(subscription.paddleCustomerId, subscription.paddleSubscriptionId) };
  } catch (error) {
    if (error instanceof PaddleError) {
      console.error(error.message);
      return { error: "unavailable" };
    }
    throw error;
  }
}

// Moves a paying organization to another paid plan. The change is applied when Paddle's webhook
// confirms it, so the page shows the new plan a moment later.
export async function changePlan(planValue: unknown): Promise<{ ok: true } | { error: "noSubscription" | "samePlan" | "unavailable" }> {
  const { organization } = await requireMember("manageSettings");
  const plan = z.string().refine(isPlanId).parse(planValue);
  const priceId = paddleConfig().prices[plan];
  if (!priceId) {
    return { error: "unavailable" };
  }
  const subscription = await getSubscription(organization.id);
  if (!subscription.paddleSubscriptionId || !["active", "past_due"].includes(subscription.status)) {
    return { error: "noSubscription" };
  }
  if (subscription.priceId === priceId) {
    return { error: "samePlan" };
  }
  try {
    await changeSubscriptionPrice(subscription.paddleSubscriptionId, priceId);
    return { ok: true };
  } catch (error) {
    if (error instanceof PaddleError) {
      console.error(error.message);
      return { error: "unavailable" };
    }
    throw error;
  }
}
