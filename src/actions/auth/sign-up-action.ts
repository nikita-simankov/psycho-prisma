"use server";

import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/utils/database";

export async function signUp(data: any) {
  console.log(data.phoneNumber);
  const userExists = await prisma.user.findFirst({
    where: {
      phoneNumber: data.phoneNumber,
    },
  });
  console.log(userExists);

  if (userExists !== null) {
    throw new Error("Пользователь с таким номером телефона уже существует");
  }

  const { password, ...credentials } = data;
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
