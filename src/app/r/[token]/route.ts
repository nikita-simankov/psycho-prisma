import { getCurrentUser } from "@/utils/authentication";
import { findLinkAssignment, markLinkUserVerified } from "@/utils/round-links";
import { rememberOrganization, startSession } from "@/utils/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// A round's email link. It signs the person in with a link session, which reaches their own
// assessments but never the dashboard or account settings. When someone else is signed in on
// this browser, it asks first instead of signing them out.
export async function GET(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const assignment = await findLinkAssignment(token);

  if (!assignment) {
    return NextResponse.redirect(new URL("/link-expired", request.url));
  }

  const current = await getCurrentUser();

  if (current && current.id !== assignment.userId) {
    return NextResponse.redirect(new URL(`/r/${token}/switch`, request.url));
  }

  if (!current) {
    await startSession(assignment.userId, "link");
  }

  await markLinkUserVerified(assignment.user);
  await rememberOrganization(assignment.round.organization.slug);

  return NextResponse.redirect(new URL("/assessments", request.url));
}
