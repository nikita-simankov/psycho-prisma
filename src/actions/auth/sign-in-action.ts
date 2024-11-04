"use server";

import { prisma } from "@/utils/database";
import { lucia } from "@/utils/authentication";
import {
  SignInFormData,
  signInSchema,
} from "@/app/auth/sign-in/schema/sign-in.schema";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";

export async function signIn(data: SignInFormData) {
  const { phoneNumber, password } = await signInSchema.parseAsync(data);

  const existingUser = await prisma.user.findFirst({
    where: {
      phoneNumber: phoneNumber,
    },
  });

  if (existingUser === null || existingUser.phoneNumber !== phoneNumber) {
    throw new Error("Пользователя с таким номером телефона не существует");
  }

  if (!(await compare(password, existingUser.password))) {
    throw new Error("Неверно указан пароль, попробуйте другой");
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return existingUser;
}
