import type { Prisma } from "@prisma/client";

// Every User column except secrets. Use this for anything that can reach the browser.
export const publicUserSelect = {
  id: true,
  role: true,
  name: true,
  surname: true,
  lastName: true,
  firstTimer: true,
  phoneNumber: true,
  imageURL: true,
  group: true,
  rank: true,
  division: true,
  dateOfBirth: true,
  recruitedBy: true,
  servingKind: true,
  servingPeriod: true,
  recruitmentDate: true,
  city: true,
  region: true,
  address: true,
  building: true,
  appartment: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
