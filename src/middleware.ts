import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/utils/constants";

// Fast path only: sends visitors without a session cookie to sign-in.
// The real session and role checks run on the server in layouts and actions.
export function middleware(request: NextRequest) {
  if (!request.cookies.get(COOKIE_NAME)?.value) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/tests/:path*", "/consent", "/organizations/:path*"],
};
