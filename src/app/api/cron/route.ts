import { runMaintenance } from "@/utils/rounds";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

// For an external scheduler: POST with "Authorization: Bearer $CRON_SECRET".
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";

  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  return Response.json(await runMaintenance());
}
