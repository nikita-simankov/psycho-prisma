import { getCurrentUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { collectPersonalData, recordExport } from "@/utils/personal-data";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

// The signed-in person's own data as a JSON download.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await collectPersonalData(user.id, await getLocale());
  const memberships = await prisma.membership.findMany({ where: { userId: user.id }, select: { organizationId: true } });
  await recordExport(user, memberships.map((membership) => membership.organizationId));

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
