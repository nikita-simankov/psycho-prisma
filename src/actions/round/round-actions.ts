"use server";

import { requireMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import {
  addMonths,
  assignPeople,
  INTERVALS,
  issueLink,
  openRound,
  PURPOSES,
  scheduleUserIds,
  sendReminder,
  validateItems,
  type OpenRoundResult,
} from "@/utils/rounds";
import { randomBytes, randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";

const itemSchema = z.object({ kind: z.enum(["test", "form"]), id: z.string().min(1) });

const candidateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).default(""),
});

const roundSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    purpose: z.enum(PURPOSES),
    message: z.string().trim().max(2000).default(""),
    items: z.array(itemSchema).min(1).max(30),
    // yyyy-mm-dd, or null for no due date.
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .default(null),
    userIds: z.array(z.string()).max(2000).default([]),
    teamIds: z.array(z.string()).max(200).default([]),
    candidates: z.array(candidateSchema).max(200).default([]),
    // 0 for a one-off round.
    repeatMonths: z
      .number()
      .int()
      .refine((months) => months === 0 || (INTERVALS as readonly number[]).includes(months))
      .default(0),
  })
  .strict();

export type CreateRoundResult =
  | ({ ok: true; emailed: number; links: { name: string; link: string }[]; skippedNames: string[] } & Pick<OpenRoundResult, "roundId">)
  | { error: "unknownItem" | "sensitiveItem" | "nobody" | "pastDue" | "candidatesNeedHiring" | "hiringRepeats" | "candidateIsStaff" };

// The day's end in the server's time zone, so "due 12 May" includes 12 May.
function endOfDay(date: string) {
  return new Date(`${date}T23:59:59`);
}

// Finds or creates the account and a candidate membership for someone outside the organization.
async function ensureCandidate(organizationId: string, candidate: z.infer<typeof candidateSchema>) {
  const user =
    (await prisma.user.findUnique({ where: { email: candidate.email }, select: { id: true } })) ??
    (await prisma.user.create({
      data: {
        id: randomUUID(),
        email: candidate.email,
        name: candidate.name,
        lastName: candidate.lastName,
        // Nobody knows this password; candidates sign in with their round link or reset it.
        password: await hash(randomBytes(32).toString("base64url"), 10),
      },
      select: { id: true },
    }));

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });

  if (!membership) {
    await prisma.membership.create({ data: { userId: user.id, organizationId, role: "candidate" } });
  }

  return user.id;
}

export async function createRound(data: unknown): Promise<CreateRoundResult> {
  const { user, membership, organization } = await requireMember("manageRounds");
  const input = roundSchema.parse(data);

  const invalid = await validateItems(organization.id, membership.role, input.purpose, input.items);
  if (invalid) {
    return { error: invalid };
  }
  if (input.candidates.length && input.purpose !== "hiring") {
    return { error: "candidatesNeedHiring" };
  }
  if (input.purpose === "hiring" && input.repeatMonths) {
    return { error: "hiringRepeats" };
  }
  const dueAt = input.dueDate ? endOfDay(input.dueDate) : null;
  if (dueAt && dueAt < new Date()) {
    return { error: "pastDue" };
  }

  // An existing staff account can't be turned into a candidate by typing their email.
  const staffEmails = await prisma.membership.findMany({
    where: { organizationId: organization.id, role: { notIn: ["member", "candidate"] }, user: { email: { in: input.candidates.map((c) => c.email) } } },
    select: { id: true },
  });
  if (staffEmails.length) {
    return { error: "candidateIsStaff" };
  }

  const candidateIds: string[] = [];
  for (const candidate of input.candidates) {
    candidateIds.push(await ensureCandidate(organization.id, candidate));
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: input.teamIds }, organizationId: organization.id },
    select: { id: true },
  });
  const teamIds = teams.map((team) => team.id);

  const schedule = input.repeatMonths
    ? await prisma.roundSchedule.create({
        data: {
          organizationId: organization.id,
          name: input.name,
          purpose: input.purpose,
          message: input.message,
          items: JSON.stringify(input.items),
          intervalMonths: input.repeatMonths,
          dueDays: dueAt ? Math.max(1, Math.ceil((dueAt.getTime() - Date.now()) / 86_400_000)) : 14,
          teamIds: JSON.stringify(teamIds),
          userIds: JSON.stringify(input.userIds),
          nextRunAt: addMonths(new Date(), input.repeatMonths),
          createdById: user.id,
        },
      })
    : null;

  const userIds = schedule
    ? await scheduleUserIds(schedule)
    : Array.from(
        new Set([
          ...input.userIds,
          ...candidateIds,
          ...(
            await prisma.membership.findMany({
              where: { organizationId: organization.id, teamId: { in: teamIds }, role: { not: "candidate" } },
              select: { userId: true },
            })
          ).map((member) => member.userId),
        ])
      );

  if (!userIds.length) {
    if (schedule) await prisma.roundSchedule.delete({ where: { id: schedule.id } });
    return { error: "nobody" };
  }

  const result = await openRound({
    organization,
    name: input.name,
    purpose: input.purpose,
    message: input.message,
    items: input.items,
    dueAt,
    userIds,
    createdById: user.id,
    scheduleId: schedule?.id,
  });

  const people = await prisma.user.findMany({
    where: { id: { in: [...result.sent.map((s) => s.userId), ...result.skipped.map((s) => s.userId)] } },
    select: { id: true, name: true, lastName: true },
  });
  const nameOf = (id: string) => {
    const person = people.find((p) => p.id === id);
    return person ? `${person.lastName} ${person.name}`.trim() : "";
  };

  return {
    ok: true,
    roundId: result.roundId,
    emailed: result.sent.filter((s) => s.emailed).length,
    // Links for people who couldn't be emailed, so they can be passed on by hand.
    links: result.sent.filter((s) => !s.emailed).map((s) => ({ name: nameOf(s.userId), link: s.link })),
    skippedNames: result.skipped.map((s) => nameOf(s.userId)),
  };
}

async function findRound(roundId: unknown) {
  const { organization } = await requireMember("manageRounds");
  return {
    organization,
    round: await prisma.round.findFirstOrThrow({ where: { id: z.string().parse(roundId), organizationId: organization.id } }),
  };
}

export async function addPeopleToRound(roundId: unknown, userIds: unknown) {
  const { organization, round } = await findRound(roundId);
  if (round.closedAt) {
    throw new Error("The round is closed");
  }
  const result = await assignPeople(round, organization, z.array(z.string()).max(2000).parse(userIds));
  return { added: result.sent.length, links: result.sent.filter((s) => !s.emailed).map((s) => s.link) };
}

export async function closeRound(roundId: unknown) {
  const { round } = await findRound(roundId);
  await prisma.$transaction([
    prisma.round.update({ where: { id: round.id }, data: { closedAt: new Date() } }),
    // Links to a closed round stop working.
    prisma.assignment.updateMany({ where: { roundId: round.id }, data: { tokenHash: null, tokenExpiresAt: null } }),
  ]);
}

export async function reopenRound(roundId: unknown) {
  const { round } = await findRound(roundId);
  await prisma.round.update({ where: { id: round.id }, data: { closedAt: null } });
}

async function findAssignment(assignmentId: unknown) {
  const { organization } = await requireMember("manageRounds");
  return prisma.assignment.findFirstOrThrow({
    where: { id: z.string().parse(assignmentId), round: { organizationId: organization.id } },
    include: {
      user: { select: { id: true, email: true, name: true, locale: true } },
      round: { include: { organization: { select: { name: true } } } },
    },
  });
}

// Emails the person a reminder with a fresh link; the link is returned for passing on by hand.
export async function remindAssignment(assignmentId: unknown) {
  const assignment = await findAssignment(assignmentId);
  if (assignment.completedAt || assignment.round.closedAt) {
    throw new Error("Nothing to remind about");
  }
  return sendReminder(assignment);
}

export async function copyAssignmentLink(assignmentId: unknown) {
  const assignment = await findAssignment(assignmentId);
  if (assignment.completedAt || assignment.round.closedAt) {
    throw new Error("The assignment is finished");
  }
  return { link: await issueLink(assignment.id, assignment.round.dueAt) };
}

export async function removeAssignment(assignmentId: unknown) {
  const assignment = await findAssignment(assignmentId);
  await prisma.assignment.delete({ where: { id: assignment.id } });
}

async function findSchedule(scheduleId: unknown) {
  const { organization } = await requireMember("manageRounds");
  return prisma.roundSchedule.findFirstOrThrow({ where: { id: z.string().parse(scheduleId), organizationId: organization.id } });
}

export async function setScheduleActive(scheduleId: unknown, active: unknown) {
  const schedule = await findSchedule(scheduleId);
  const on = z.boolean().parse(active);
  let nextRunAt = schedule.nextRunAt;
  // A schedule resumed after its date passed starts again from today rather than catching up.
  while (on && nextRunAt < new Date()) {
    nextRunAt = addMonths(nextRunAt, schedule.intervalMonths);
  }
  await prisma.roundSchedule.update({ where: { id: schedule.id }, data: { active: on, nextRunAt } });
}

export async function deleteSchedule(scheduleId: unknown) {
  const schedule = await findSchedule(scheduleId);
  // Rounds it already opened stay, with their results.
  await prisma.roundSchedule.delete({ where: { id: schedule.id } });
}
