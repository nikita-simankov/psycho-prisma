import { lucia } from "@/utils/authentication";
import { findLinkAssignment, linkDestination, markLinkUserVerified } from "@/utils/round-links";
import { rememberOrganization, startSession } from "@/utils/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// "Continue as" on the switch page: ends the other person's session on this browser and opens
// the link holder's assessments. Only accepted from our own pages.
export async function POST(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const origin = request.headers.get("origin");

  if (origin && origin !== new URL(request.url).origin) {
    return new Response("Forbidden", { status: 403 });
  }

  const assignment = await findLinkAssignment(token);

  if (!assignment) {
    return NextResponse.redirect(new URL("/link-expired", request.url), 303);
  }

  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value;
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  await startSession(assignment.userId, "link");
  await markLinkUserVerified(assignment.user);
  await rememberOrganization(assignment.round.organization.slug);

  return NextResponse.redirect(new URL(await linkDestination(assignment), request.url), 303);
}
