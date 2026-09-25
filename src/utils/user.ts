import type { Prisma } from "@prisma/client";

// Every User column except secrets. Use this for anything that can reach the browser.
export const publicUserSelect = {
  id: true,
  role: true,
  name: true,
  middleName: true,
  lastName: true,
  firstTimer: true,
  phoneNumber: true,
  imageURL: true,
  group: true,
  department: true,
  position: true,
  dateOfBirth: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

type NamedUser = Pick<PublicUser, "lastName" | "name" | "middleName">;

export function formatFullName(user: NamedUser) {
  return [user.lastName, user.name, user.middleName].filter(Boolean).join(" ");
}

export function formatInitials(user: Pick<PublicUser, "lastName" | "name">) {
  return ((user.name[0] ?? "") + (user.lastName[0] ?? "")).toUpperCase();
}

export function formatWorkInfo(user: Pick<PublicUser, "department" | "position">) {
  return [user.position, user.department].filter(Boolean).join(", ");
}
