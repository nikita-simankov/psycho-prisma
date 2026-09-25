import { getCurrentUser, lucia } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { rememberOrganization, startSession } from "@/utils/session";
import { hashToken } from "@/utils/tokens";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// A round's email link: signs the person in and opens their assessments.
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const assignment = await prisma.assignment.findUnique({
    where: { tokenHash: hashToken(params.token) },
    include: { round: { include: { organization: { select: { slug: true } } } } },
  });

  if (!assignment?.tokenExpiresAt || assignment.tokenExpiresAt < new Date() || assignment.round.closedAt) {
    return NextResponse.redirect(new URL("/link-expired", request.url));
  }

  const current = await getCurrentUser();

  if (current?.id !== assignment.userId) {
    // Someone else was signed in on this browser; the link belongs to this person.
    const sessionId = cookies().get(lucia.sessionCookieName)?.value;
    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }
    await startSession(assignment.userId);
  }

  rememberOrganization(assignment.round.organization.slug);

  return NextResponse.redirect(new URL("/assessments", request.url));
}
