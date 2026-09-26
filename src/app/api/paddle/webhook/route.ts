import { applyPaddleEvent } from "@/utils/billing";
import { paddleConfig } from "@/utils/paddle";
import { verifyPaddleSignature } from "@/utils/paddle-events";
import { NextRequest, NextResponse } from "next/server";

// Paddle's notifications. The signature is checked against the raw body before anything is read,
// then each event is stored and applied once (src/utils/billing.ts). Paddle retries on any non-2xx.
export async function POST(request: NextRequest) {
  const { webhookSecret } = paddleConfig();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"), webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event_id?: unknown; event_type?: unknown; data?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof event.event_id !== "string" || typeof event.event_type !== "string") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  try {
    const outcome = await applyPaddleEvent({ event_id: event.event_id, event_type: event.event_type, data: event.data }, rawBody);
    return NextResponse.json({ outcome });
  } catch (error) {
    console.error("Paddle webhook failed", event.event_id, error);
    return NextResponse.json({ error: "Could not apply the event" }, { status: 500 });
  }
}
