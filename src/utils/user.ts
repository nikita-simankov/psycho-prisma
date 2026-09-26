import type { Prisma } from "@prisma/client";
import { parseCustomValues, parseTags } from "./profile-fields";
import { can } from "./roles";

// Every User column except secrets. Use this for anything that can reach the browser.
export const publicUserSelect = {
  id: true,
  name: true,
  middleName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  imageURL: true,
  dateOfBirth: true,
  firstTimer: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export const memberInclude = {
  user: { select: publicUserSelect },
  team: { select: { id: true, name: true } },
} satisfies Prisma.MembershipInclude;

type MembershipWithUser = Prisma.MembershipGetPayload<{ include: typeof memberInclude }>;

// A person as seen inside one organization. `id` is the user id, so profile links stay stable.
export type Member = PublicUser & {
  membershipId: string;
  role: string;
  teamId: string | null;
  department: string;
  position: string;
  // Empty unless the viewer may see restricted flags.
  flag: string;
  consentedAt: Date | null;
  joinedAt: Date;
  managerId: string | null;
  startDate: string;
  location: string;
  employmentType: string;
  tags: string[];
  customValues: Record<string, string>;
};

export function toMember(membership: MembershipWithUser, viewerRole: string): Member {
  return {
    ...membership.user,
    membershipId: membership.id,
    role: membership.role,
    teamId: membership.teamId,
    department: membership.team?.name ?? "",
    position: membership.position,
    flag: can(viewerRole, "viewSensitive") ? membership.flag : "",
    consentedAt: membership.consentedAt,
    joinedAt: membership.createdAt,
    managerId: membership.managerId,
    startDate: membership.startDate,
    location: membership.location,
    employmentType: membership.employmentType,
    tags: parseTags(membership.tags),
    customValues: parseCustomValues(membership.customValues),
  };
}

type NamedUser = Pick<PublicUser, "lastName" | "name" | "middleName">;

export function formatFullName(user: NamedUser) {
  return [user.lastName, user.name, user.middleName].filter(Boolean).join(" ");
}

export function formatInitials(user: Pick<PublicUser, "lastName" | "name">) {
  return ((user.name[0] ?? "") + (user.lastName[0] ?? "")).toUpperCase();
}

export function formatWorkInfo(user: { department: string; position: string }) {
  return [user.position, user.department].filter(Boolean).join(", ");
}
