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

  const result = await runMaintenance();
  // A failed step answers 500 so the external scheduler shows the run as failed.
  return Response.json(result, { status: result.failed.length ? 500 : 200 });
}
