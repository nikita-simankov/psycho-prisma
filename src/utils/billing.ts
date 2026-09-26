import "server-only";

import { audit } from "./audit";
import {
  effectivePlan,
  featureLevel,
  hasFeature,
  planById,
  respondentAllowance,
  TRIAL_DAYS,
  usagePeriodStart,
  type FeatureKey,
} from "./billing-rules";
import { prisma } from "./database";
import { subscriptionFromPaddle, type PaddleSubscription } from "./paddle-events";
import { planForPrice } from "./paddle";
import { STAFF_ROLES } from "./roles";

const DAY = 86_400_000;

export function trialData(now = new Date()) {
  return { plan: "business", status: "trialing", trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * DAY) };
}

// The organization's subscription. Organizations always have one (migration 1_billing and
// createOwnedOrganization); one made any other way starts a trial the first time it is read.
// Several parts of a page can ask at once, and two concurrent upserts can both try to insert,
// so a unique-key clash means the other one won and its row is read instead.
export async function getSubscription(organizationId: string) {
  const existing = await prisma.subscription.findUnique({ where: { organizationId } });
  if (existing) {
    return existing;
  }
  try {
    return await prisma.subscription.upsert({ where: { organizationId }, create: { organizationId, ...trialData() }, update: {} });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return prisma.subscription.findUniqueOrThrow({ where: { organizationId } });
    }
    throw error;
  }
}

export async function getPlan(organizationId: string) {
  const subscription = await getSubscription(organizationId);
  return { subscription, plan: effectivePlan(subscription) };
}

// People who submitted a test or questionnaire since the start of the usage period.
export async function respondentIds(organizationId: string, since: Date) {
  const where = { organizationId, createdAt: { gte: since } };
  const [tests, forms] = await Promise.all([
    prisma.testSubmission.findMany({ where, select: { userId: true }, distinct: ["userId"] }),
    prisma.formSubmission.findMany({ where, select: { userId: true }, distinct: ["userId"] }),
  ]);
  return new Set([...tests, ...forms].map((submission) => submission.userId));
}

// Staff seats in use: staff memberships plus open invitations to a staff role.
// Staff members plus open staff invitations. `exceptEmail` leaves out an invitation that is about
// to be replaced, so sending someone a new invitation doesn't count them twice.
export async function seatsUsed(organizationId: string, exceptEmail?: string) {
  const [members, invitations] = await Promise.all([
    prisma.membership.count({ where: { organizationId, role: { in: [...STAFF_ROLES] } } }),
    prisma.invitation.count({
      where: {
        organizationId,
        role: { in: [...STAFF_ROLES] },
        acceptedAt: null,
        expiresAt: { gt: new Date() },
        ...(exceptEmail ? { NOT: { email: exceptEmail } } : {}),
      },
    }),
  ]);
  return members + invitations;
}

export async function getUsage(organizationId: string) {
  const { subscription, plan } = await getPlan(organizationId);
  const since = usagePeriodStart(subscription);
  const [respondents, seats] = await Promise.all([respondentIds(organizationId, since), seatsUsed(organizationId)]);
  return { subscription, plan, since, respondents: respondents.size, seats };
}

export async function planHasFeature(organizationId: string, feature: FeatureKey) {
  return hasFeature((await getPlan(organizationId)).plan, feature);
}

// Whether a round for these people fits the plan. People already counted this period are free;
// a round that is already running is never cut off, this is only checked when people are added.
export async function checkRespondents(organizationId: string, userIds: string[]) {
  const { subscription, plan } = await getPlan(organizationId);
  const allowance = respondentAllowance(plan);
  if (allowance === null) {
    return { ok: true as const };
  }
  const counted = await respondentIds(organizationId, usagePeriodStart(subscription));
  const added = userIds.filter((id) => !counted.has(id)).length;
  return counted.size + added <= allowance ? { ok: true as const } : { ok: false as const, used: counted.size, allowance };
}

// Whether one more staff seat fits the plan. `replacingEmail` is the invitee whose open
// invitation the new one replaces.
export async function checkSeat(organizationId: string, role: string, replacingEmail?: string) {
  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    return true;
  }
  const { plan } = await getPlan(organizationId);
  const { staffSeats } = planById(plan);
  return staffSeats === null || (await seatsUsed(organizationId, replacingEmail)) < staffSeats;
}

type PaddleEvent = { event_id: string; event_type: string; occurred_at?: string; data: unknown };

// Applies one Paddle webhook. Each event is stored first and applied once; a resend of an event we
// already applied is a no-op, and one that failed before is tried again.
export async function applyPaddleEvent(event: PaddleEvent, rawBody: string) {
  const existing = await prisma.billingEvent.findUnique({ where: { paddleEventId: event.event_id } });
  if (existing?.processedAt) {
    return "duplicate";
  }
  const record =
    existing ?? (await prisma.billingEvent.create({ data: { paddleEventId: event.event_id, type: event.event_type, payload: rawBody } }));

  try {
    const organizationId = event.event_type.startsWith("subscription.")
      ? await applySubscription(event.data as PaddleSubscription)
      : null;
    await prisma.billingEvent.update({ where: { id: record.id }, data: { processedAt: new Date(), organizationId, error: "" } });
    return "applied";
  } catch (error) {
    await prisma.billingEvent.update({ where: { id: record.id }, data: { error: String(error).slice(0, 500) } });
    throw error;
  }
}

async function applySubscription(data: PaddleSubscription) {
  const update = subscriptionFromPaddle(data, planForPrice);
  if (!update) {
    return null;
  }
  const current =
    (await prisma.subscription.findUnique({ where: { paddleSubscriptionId: data.id } })) ??
    (data.custom_data?.organizationId
      ? await prisma.subscription.findUnique({ where: { organizationId: data.custom_data.organizationId } })
      : null);
  const organizationId = current?.organizationId ?? data.custom_data?.organizationId;
  if (!organizationId || !(await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } }))) {
    return null;
  }
  // The organization id in custom_data comes from the checkout page. A second subscription never
  // replaces one that is still being paid for, so nobody can swap another organization's plan.
  if (current?.paddleSubscriptionId && current.paddleSubscriptionId !== data.id && ["active", "past_due"].includes(current.status)) {
    console.warn("Ignoring Paddle subscription", data.id, "for an organization already paying with", current.paddleSubscriptionId);
    return organizationId;
  }
  // Paddle doesn't promise order: an event older than what we have is ignored.
  if (current?.paddleUpdatedAt && update.paddleUpdatedAt && update.paddleUpdatedAt < current.paddleUpdatedAt) {
    return organizationId;
  }

  const pastDueSince = update.status === "past_due" ? (current?.pastDueSince ?? new Date()) : null;
  const fields = {
    ...update,
    // A cancelled subscription reports no billing period; keep the end of the one it paid for.
    currentPeriodEnd: update.currentPeriodEnd ?? current?.currentPeriodEnd ?? null,
    pastDueSince,
  };
  await prisma.subscription.upsert({ where: { organizationId }, create: { organizationId, ...fields }, update: fields });

  if (!current || current.plan !== update.plan || current.status !== update.status) {
    await audit(organizationId, null, "changePlan", { detail: { plan: update.plan, status: update.status } });
  }
  return organizationId;
}

export class PlanLimitError extends Error {
  constructor(readonly feature: FeatureKey) {
    super(`The plan doesn't include ${feature}`);
    this.name = "PlanLimitError";
  }
}

// For server actions behind a paid feature. Pages hide these actions on lower plans; this stops a
// request made anyway. `full` requires the whole feature, not a partial level such as "copy".
export async function requireFeature(organizationId: string, feature: FeatureKey, full = false) {
  const level = featureLevel((await getPlan(organizationId)).plan, feature);
  if (level === false || (full && level !== true)) {
    throw new PlanLimitError(feature);
  }
}
