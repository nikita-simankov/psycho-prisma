"use server";

import { requireMember } from "@/utils/authentication";
import { checkRespondents, planHasFeature } from "@/utils/billing";
import { prisma } from "@/utils/database";
import {
  addMonths,
  assignPeople,
  extendLinks,
  INTERVALS,
  issueLink,
  openRound,
  PURPOSES,
  scheduleUserIds,
  roundEmail,
  sendReminder,
  submittedItems,
  validateItems,
  type OpenRoundResult,
} from "@/utils/rounds";
import { randomBytes, randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { absoluteUrl, sendMail } from "@/utils/mail";
import { consumeRateLimit } from "@/utils/rate-limit";
import { getLocale } from "next-intl/server";
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
    // Open invitations: these people get the round when they join.
    invitationIds: z.array(z.string()).max(500).default([]),
    // 0 for a one-off round.
    repeatMonths: z
      .number()
      .int()
      .refine((months) => months === 0 || (INTERVALS as readonly number[]).includes(months))
      .default(0),
    // Starts from each person's start date instead of now; see src/utils/lifecycle.ts.
    lifecycle: z.enum(["", "start30", "start90", "anniversary"]).default(""),
    // The composer's saved draft, removed once the round is sent.
    draftId: z.string().nullable().default(null),
  })
  .strict();

export type CreateRoundResult =
  | ({ ok: true; emailed: number; queued: number; links: { name: string; link: string }[]; skippedNames: string[]; waiting: number } & Pick<OpenRoundResult, "roundId">)
  | { ok: true; scheduled: true }
  | { error: "unknownItem" | "sensitiveItem" | "nobody" | "pastDue" | "candidatesNeedHiring" | "hiringRepeats" | "candidateIsStaff" | "planSchedules" | "planClinical" | "planRespondents" | "emailUnverified" };

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
  // Unconfirmed accounts can't email other people (see the confirmation banner).
  if (!user.emailVerifiedAt) {
    return { error: "emailUnverified" };
  }
  const input = roundSchema.parse(data);

  const invalid = await validateItems(organization.id, membership.role, input.purpose, input.items);
  if (invalid) {
    return { error: invalid };
  }
  if (input.candidates.length && input.purpose !== "hiring") {
    return { error: "candidatesNeedHiring" };
  }
  if (input.purpose === "hiring" && (input.repeatMonths || input.lifecycle)) {
    return { error: "hiringRepeats" };
  }
  if ((input.repeatMonths || input.lifecycle) && !(await planHasFeature(organization.id, "schedules"))) {
    return { error: "planSchedules" };
  }
  const testIds = input.items.filter((item) => item.kind === "test").map((item) => item.id);
  if (
    (await prisma.test.count({ where: { id: { in: testIds }, sensitive: true } })) &&
    !(await planHasFeature(organization.id, "clinical"))
  ) {
    return { error: "planClinical" };
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

  // A start-date rule sends nothing now; the hourly job opens rounds as people reach the date.
  if (input.lifecycle) {
    await prisma.roundSchedule.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        purpose: input.purpose,
        message: input.message,
        items: JSON.stringify(input.items),
        intervalMonths: 12,
        trigger: input.lifecycle === "anniversary" ? "anniversary" : "startDate",
        offsetDays: input.lifecycle === "start30" ? 30 : input.lifecycle === "start90" ? 90 : 0,
        dueDays: dueAt ? Math.max(1, Math.ceil((dueAt.getTime() - Date.now()) / 86_400_000)) : 14,
        teamIds: JSON.stringify(teamIds),
        userIds: JSON.stringify(input.userIds),
        nextRunAt: new Date(),
        createdById: user.id,
      },
    });
    await discardDraft(organization.id, input.draftId);
    return { ok: true, scheduled: true };
  }

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

  // Invited people who haven't joined yet, picked by hand or through their team.
  const invitees = await prisma.invitation.findMany({
    where: {
      organizationId: organization.id,
      acceptedAt: null,
      role: "member",
      expiresAt: { gt: new Date() },
      OR: [{ id: { in: input.invitationIds } }, ...(teamIds.length ? [{ teamId: { in: teamIds } }] : [])],
    },
    select: { email: true },
  });

  if (!userIds.length && !invitees.length) {
    if (schedule) await prisma.roundSchedule.delete({ where: { id: schedule.id } });
    return { error: "nobody" };
  }
  if (!(await checkRespondents(organization.id, userIds)).ok) {
    if (schedule) await prisma.roundSchedule.delete({ where: { id: schedule.id } });
    return { error: "planRespondents" };
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

  if (invitees.length) {
    await prisma.roundInvitee.createMany({
      data: invitees.map((invitee) => ({ roundId: result.roundId, email: invitee.email })),
      skipDuplicates: true,
    });
  }

  const people = await prisma.user.findMany({
    where: { id: { in: [...result.sent.map((s) => s.userId), ...result.skipped.map((s) => s.userId)] } },
    select: { id: true, name: true, lastName: true },
  });
  const nameOf = (id: string) => {
    const person = people.find((p) => p.id === id);
    return person ? `${person.lastName} ${person.name}`.trim() : "";
  };

  await discardDraft(organization.id, input.draftId);

  return {
    ok: true,
    roundId: result.roundId,
    emailed: result.sent.filter((s) => s.emailed).length,
    queued: result.queued.length,
    // Links for people who couldn't be emailed, so they can be passed on by hand.
    links: result.sent.filter((s) => !s.emailed).map((s) => ({ name: nameOf(s.userId), link: s.link })),
    skippedNames: result.skipped.map((s) => nameOf(s.userId)),
    waiting: invitees.length,
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
  const { user } = await requireMember("manageRounds");
  if (!user.emailVerifiedAt) {
    return { error: "emailUnverified" as const };
  }
  const { organization, round } = await findRound(roundId);
  if (round.closedAt) {
    throw new Error("The round is closed");
  }
  const chosen = z.array(z.string()).max(2000).parse(userIds);
  if (!(await checkRespondents(organization.id, chosen)).ok) {
    return { error: "planRespondents" as const };
  }
  const result = await assignPeople(round, organization, chosen);
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
  // Start-date rules run every hour and have no date of their own.
  while (on && schedule.trigger === "interval" && nextRunAt < new Date()) {
    nextRunAt = addMonths(nextRunAt, schedule.intervalMonths);
  }
  await prisma.roundSchedule.update({ where: { id: schedule.id }, data: { active: on, nextRunAt } });
}

export async function deleteSchedule(scheduleId: unknown) {
  const schedule = await findSchedule(scheduleId);
  // Rounds it already opened stay, with their results.
  await prisma.roundSchedule.delete({ where: { id: schedule.id } });
}

async function discardDraft(organizationId: string, draftId: string | null) {
  if (draftId) {
    await prisma.roundDraft.deleteMany({ where: { id: draftId, organizationId } });
  }
}

const draftSchema = z.object({ name: z.string().max(200).default("") }).passthrough();

// Saves the composer as it's edited, so an unsent round can be finished later.
export async function saveRoundDraft(draftId: unknown, data: unknown): Promise<{ id: string }> {
  const { organization, user } = await requireMember("manageRounds");
  const parsed = draftSchema.parse(data);
  const json = JSON.stringify(parsed);
  if (json.length > 200_000) {
    throw new Error("Draft too large");
  }
  const id = z.string().nullable().parse(draftId ?? null);
  if (id) {
    const updated = await prisma.roundDraft.updateMany({
      where: { id, organizationId: organization.id },
      data: { name: parsed.name.trim(), data: json },
    });
    if (updated.count) return { id };
  }
  const draft = await prisma.roundDraft.create({
    data: { organizationId: organization.id, createdById: user.id, name: parsed.name.trim(), data: json },
  });
  return { id: draft.id };
}

export async function deleteRoundDraft(draftId: unknown) {
  const { organization } = await requireMember("manageRounds");
  await discardDraft(organization.id, z.string().parse(draftId));
}

const previewSchema = z.object({
  name: z.string().trim().max(200),
  message: z.string().trim().max(2000).default(""),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

// The invitation email exactly as people will get it, addressed to the person composing it.
export async function previewRoundEmail(data: unknown) {
  const { organization, user } = await requireMember("manageRounds");
  const input = previewSchema.parse(data);
  const email = await roundEmail(
    "invite",
    { name: user.name, locale: await getLocale() },
    organization.name,
    { name: input.name, message: input.message, dueAt: input.dueDate ? endOfDay(input.dueDate) : null },
    await absoluteUrl("/assessments")
  );
  return { subject: email.subject, html: email.html };
}

// Sends that preview to the composer's own inbox.
export async function sendTestRoundEmail(data: unknown): Promise<{ emailed: boolean } | { error: "emailUnverified" | "rateLimited" }> {
  const { organization, user } = await requireMember("manageRounds");
  if (!user.emailVerifiedAt || !user.email) {
    return { error: "emailUnverified" };
  }
  if (!consumeRateLimit(`round-test:${user.id}`, 10, 60 * 60_000)) {
    return { error: "rateLimited" };
  }
  const input = previewSchema.parse(data);
  const email = await roundEmail(
    "invite",
    { name: user.name, locale: await getLocale() },
    organization.name,
    { name: input.name, message: input.message, dueAt: input.dueDate ? endOfDay(input.dueDate) : null },
    await absoluteUrl("/assessments")
  );
  return { emailed: await sendMail({ to: user.email, ...email }) };
}

// Reminds everyone in the round who hasn't started any of it yet.
export async function remindNotStarted(roundId: unknown) {
  const { round } = await findRound(roundId);
  if (round.closedAt) {
    throw new Error("The round is closed");
  }
  const open = await prisma.assignment.findMany({
    where: { roundId: round.id, completedAt: null, invitedAt: { not: null } },
    include: {
      user: { select: { id: true, email: true, name: true, locale: true } },
      round: { include: { organization: { select: { name: true } } } },
    },
  });
  const started = await submittedItems(open.map((assignment) => assignment.id));
  const waiting = open.filter((assignment) => !started.get(assignment.id)?.size);
  let emailed = 0;
  for (const assignment of waiting) {
    if ((await sendReminder(assignment)).emailed) emailed += 1;
  }
  return { reminded: waiting.length, emailed };
}

// Moves a round's due date, from the calendar. Links are extended to match.
export async function moveRoundDue(roundId: unknown, date: unknown) {
  const { round } = await findRound(roundId);
  const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(date);
  const dueAt = endOfDay(day);
  if (dueAt < new Date()) {
    return { error: "pastDue" as const };
  }
  await prisma.round.update({ where: { id: round.id }, data: { dueAt } });
  await extendLinks(round.id, dueAt);
  return { ok: true as const };
}
