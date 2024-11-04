"use server"
import { prisma } from "@/utils/database";

export async function UpdateUserInfoAction(id: string, data: any) {
  const updatedUser = await prisma.user.update({
    where: {
      id: id,
    },
    data: data
  })

  return updatedUser
}