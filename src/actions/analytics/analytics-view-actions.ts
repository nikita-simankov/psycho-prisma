"use server";

import { requireMember } from "@/utils/authentication";
import { requireFeature } from "@/utils/billing";
import { filtersToQuery, parseFilters } from "@/utils/analytics-filters";
import { prisma } from "@/utils/database";
import { z } from "zod";

const MAX_VIEWS = 30;

// Saves the current filters under a name, for the signed-in person only.
export async function saveAnalyticsView(name: unknown, query: unknown) {
  const { user, organization } = await requireMember("viewDashboard");
  await requireFeature(organization.id, "analytics", true);
  const cleanName = z.string().trim().min(1).max(60).parse(name);
  const cleanQuery = filtersToQuery(parseFilters(new URLSearchParams(z.string().max(1000).parse(query))));
  const scope = { organizationId: organization.id, userId: user.id };

  if ((await prisma.analyticsView.count({ where: scope })) >= MAX_VIEWS) {
    return { error: "tooMany" as const };
  }

  const view = await prisma.analyticsView.create({ data: { ...scope, name: cleanName, query: cleanQuery } });
  return { ok: true as const, id: view.id };
}

export async function deleteAnalyticsView(id: unknown) {
  const { user, organization } = await requireMember("viewDashboard");
  await prisma.analyticsView.deleteMany({
    where: { id: z.string().parse(id), organizationId: organization.id, userId: user.id },
  });
}
