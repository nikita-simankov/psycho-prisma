import { authorizationRequest, isOAuthProvider, OAUTH_COOKIE, oauthCallbackUrl, safeNext } from "@/utils/oauth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Starts Google or Microsoft sign-in. `next` is where to go afterwards (an invitation or join link).
export async function GET(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const url = new URL(request.url);
  const started = isOAuthProvider(provider) ? authorizationRequest(provider, oauthCallbackUrl(url.origin, provider)) : null;

  if (!started || !isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/auth/sign-in?reason=oauthFailed", request.url));
  }

  (await cookies()).set(
    OAUTH_COOKIE,
    JSON.stringify({ provider, state: started.state, verifier: started.verifier, next: safeNext(url.searchParams.get("next")) }),
    {
      path: "/auth/oauth",
      maxAge: 10 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }
  );

  return NextResponse.redirect(started.url);
}
