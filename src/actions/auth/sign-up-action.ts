"use server";

import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/utils/database";
import {
  SignUpFormData,
  signUpFormSchema,
} from "@/app/auth/sign-up/schema/sign-up-form-schema";

export async function signUp(data: SignUpFormData) {
  const rawCredentials = await signUpFormSchema.parseAsync(data);

  const userExists = await prisma.user.findFirst({
    where: {
      phoneNumber: rawCredentials.phoneNumber,
    },
  });

  if (userExists) {
    throw new Error("Пользователь с таким номером телефона уже существует");
  }

  const { password, ...credentials } = rawCredentials;
  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      id: randomUUID().toString(),
      role: "user",
      password: hashedPassword,
      ...credentials,
    },
  });
}
