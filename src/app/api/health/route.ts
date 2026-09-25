import { prisma } from "@/utils/database";

export const dynamic = "force-dynamic";

// Used by the hosting platform to decide whether a deploy is ready.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "database unavailable" }, { status: 503 });
  }
}
