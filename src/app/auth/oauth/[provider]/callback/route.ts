import { getCurrentUser, homePath, isLinkSession } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { sendVerificationEmail } from "@/utils/email-verification";
import { fetchProfile, isOAuthProvider, OAUTH_COOKIE, oauthCallbackUrl, safeNext, type OAuthProfile, type OAuthProvider } from "@/utils/oauth";
import { rememberOrganization, startSession } from "@/utils/session";
import { hash } from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Pending = { provider: string; state: string; verifier: string; next: string | null };

async function signInAs(userId: string, next: string | null) {
  await startSession(userId);
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { role: true, organization: { select: { slug: true } } },
  });
  if (membership) {
    await rememberOrganization(membership.organization.slug);
  }
  return next ?? homePath(membership);
}

function link(provider: OAuthProvider, profile: OAuthProfile, userId: string) {
  return prisma.oAuthAccount.create({ data: { provider, providerUserId: profile.id, userId, email: profile.email } });
}

// Where Google or Microsoft sends the person back. Signs in the linked account, links a signed-in
// or verified-email account, or creates a new one.
export async function GET(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const url = new URL(request.url);
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/auth/oauth" });
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  let pending: Pending | null = null;
  try {
    pending = raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    pending = null;
  }
  const code = url.searchParams.get("code");
  if (
    !isOAuthProvider(provider) ||
    !pending ||
    pending.provider !== provider ||
    !code ||
    url.searchParams.get("state") !== pending.state
  ) {
    return go("/auth/sign-in?reason=oauthFailed");
  }
  const next = safeNext(pending.next);

  const profile = await fetchProfile(provider, code, pending.verifier, oauthCallbackUrl(url.origin, provider)).catch(() => null);
  if (!profile?.id) {
    return go("/auth/sign-in?reason=oauthFailed");
  }

  const current = (await isLinkSession()) ? null : await getCurrentUser();
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider, providerUserId: profile.id } },
    select: { userId: true },
  });

  if (linked) {
    if (current && current.id !== linked.userId) {
      return go("/account?oauth=taken");
    }
    return go(current ? (next ?? "/account") : await signInAs(linked.userId, next));
  }

  // Signed in with a password: this connects the provider to that account.
  if (current) {
    await link(provider, profile, current.id);
    return go(next ?? "/account?oauth=connected");
  }

  const existing = await prisma.user.findUnique({ where: { email: profile.email }, select: { id: true, emailVerifiedAt: true } });
  if (existing) {
    if (!profile.emailVerified) {
      const signIn = new URLSearchParams({ reason: "oauthExisting", ...(next && { next }) });
      return go(`/auth/sign-in?${signIn}`);
    }
    await link(provider, profile, existing.id);
    if (!existing.emailVerifiedAt) {
      await prisma.user.update({ where: { id: existing.id }, data: { emailVerifiedAt: new Date() } });
    }
    return go(await signInAs(existing.id, next));
  }

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      lastName: profile.lastName,
      // Nobody knows this password; they can set one with "Forgot password".
      password: await hash(randomBytes(32).toString("base64url"), 10),
      locale: await getLocale(),
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
    },
    select: { id: true, email: true },
  });
  await link(provider, profile, user.id);
  if (!profile.emailVerified) {
    await sendVerificationEmail(user);
  }

  return go(await signInAs(user.id, next));
}
