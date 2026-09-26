import { NextRequest, NextResponse } from "next/server";
import { INDEXABLE_PATHS } from "@/utils/site";
import { COOKIE_NAME, ORGANIZATION_COOKIE, ORGANIZATION_HEADER, RESERVED_SLUGS } from "@/utils/constants";

const PUBLIC_PATHS = ["/", "/product", "/pricing", "/instruments", "/security", "/legal", "/privacy", "/link-expired", "/opengraph-image"];
// /r/<token> is a round's sign-in link.
const PUBLIC_PREFIXES = ["/auth/", "/invite/", "/join/", "/r/", "/instruments/", "/legal/"];

// Fast path only: sends visitors without a session cookie to sign-in, and tells
// the server which organization a /[org] URL belongs to. Real session and role
// checks run on the server in layouts and actions.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return INDEXABLE_PATHS.includes(pathname) ? NextResponse.next() : noindex(NextResponse.next());
  }

  if (!request.cookies.get(COOKIE_NAME)?.value) {
    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return noindex(NextResponse.redirect(signIn));
  }

  if (!firstSegment || RESERVED_SLUGS.has(firstSegment)) {
    return noindex(NextResponse.next());
  }

  // /acme/... : the organization comes from the URL, so each tab works in its own one.
  const headers = new Headers(request.headers);
  headers.set(ORGANIZATION_HEADER, firstSegment);
  const response = noindex(NextResponse.next({ request: { headers } }));
  response.cookies.set(ORGANIZATION_COOKIE, firstSegment, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

// Private pages, invitations and one-time links stay out of search results.
function noindex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Everything except Next internals, API routes and files with an extension.
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
