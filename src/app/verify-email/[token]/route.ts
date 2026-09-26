import { getContext, homePath } from "@/utils/authentication";
import { confirmEmail } from "@/utils/email-verification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The link in the confirmation email.
export async function GET(request: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const userId = await confirmEmail(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/verify-email/expired", request.url));
  }

  const context = await getContext();
  const destination =
    context?.user.id === userId ? (context.membership ? homePath(context.membership) : "/organizations/new") : "/auth/sign-in?verified=1";

  return NextResponse.redirect(new URL(destination, request.url));
}
