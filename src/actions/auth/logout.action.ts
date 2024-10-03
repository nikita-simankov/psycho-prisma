import { lucia, useSession } from "@/utils/authentication";
import { ActionResult } from "next/dist/server/app-render/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout(): Promise<ActionResult> {
  "use server";
  const user = await useSession();
  if (!user) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(user.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/auth/sign-in");
}
