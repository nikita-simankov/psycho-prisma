import "server-only";

import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "next-intl";
import { localizeForm, localizeTest } from "./content-translation";
import { prisma } from "./database";
import { libraryWhere } from "./library";
import { absoluteUrl, sendMail } from "./mail";
import { can } from "./roles";
import { createToken } from "./tokens";

export const PURPOSES = ["development", "hiring", "wellbeing"] as const;
export type Purpose = (typeof PURPOSES)[number];

// How often a recurring round can repeat, in months.
export const INTERVALS = [1, 3, 6, 12] as const;

export type RoundItem = { kind: "test" | "form"; id: string };

const DAY = 24 * 60 * 60_000;
// Sign-in links stay valid this long after the due date (or after sending, with no due date).
const LINK_GRACE_DAYS = 14;
// People get one reminder when this close to the due date.
const REMINDER_DAYS = 2;

export function parseItems(json: string): RoundItem[] {
  try {
    const items = JSON.parse(json);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function itemKey(item: RoundItem) {
  return `${item.kind}:${item.id}`;
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // 31 January + 1 month lands on 3 March; step back to the last day of February.
  if (result.getDate() < day) {
    result.setDate(0);
  }
  return result;
}

// Checks that every item exists in the organization's library and may be sent for this purpose
// by this role. Clinical screens need a role that may see their results, and never go to hiring.
export async function validateItems(organizationId: string, role: string, purpose: Purpose, items: RoundItem[]) {
  const testIds = items.filter((item) => item.kind === "test").map((item) => item.id);
  const formIds = items.filter((item) => item.kind === "form").map((item) => item.id);

  const [tests, forms] = await Promise.all([
    prisma.test.findMany({
      where: { id: { in: testIds }, AND: [libraryWhere(organizationId)] },
      select: { id: true, sensitive: true },
    }),
    prisma.form.findMany({
      where: { id: { in: formIds }, adminOnly: false, AND: [libraryWhere(organizationId)] },
      select: { id: true },
    }),
  ]);

  if (tests.length !== new Set(testIds).size || forms.length !== new Set(formIds).size) {
    return "unknownItem" as const;
  }

  if (tests.some((test) => test.sensitive) && (purpose === "hiring" || !can(role, "viewSensitive"))) {
    return "sensitiveItem" as const;
  }

  return null;
}

type Recipient = { id: string; email: string | null; name: string; locale: string };

function translatorFor(locale: string) {
  const chosen: Locale = isLocale(locale) ? locale : isLocale(process.env.MAIL_LOCALE) ? process.env.MAIL_LOCALE : DEFAULT_LOCALE;
  return { locale: chosen, t: createTranslator({ locale: chosen, messages: chosen === "ru" ? ru : en, namespace: "mail.round" }) };
}

// Replaces the assignment's sign-in link and returns the new one. Old links stop working.
export async function issueLink(assignmentId: string, dueAt: Date | null) {
  const { token, tokenHash } = createToken();
  const expires = new Date(Math.max(dueAt?.getTime() ?? 0, Date.now()) + LINK_GRACE_DAYS * DAY);

  await prisma.assignment.update({ where: { id: assignmentId }, data: { tokenHash, tokenExpiresAt: expires } });

  return absoluteUrl(`/r/${token}`);
}

async function mailAssignment(
  kind: "invite" | "reminder",
  recipient: Recipient,
  organization: string,
  round: { name: string; message: string; dueAt: Date | null },
  link: string
) {
  if (!recipient.email) {
    return false;
  }

  const { locale, t } = translatorFor(recipient.locale);
  const due = round.dueAt ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(round.dueAt) : null;
  const values = { organization, round: round.name, name: recipient.name, link };
  const body = [
    t(kind === "invite" ? "inviteText" : "reminderText", values),
    round.message ? `\n${round.message}\n` : "",
    due ? t("due", { date: due }) : "",
    t("open", { link }),
    t("footer"),
  ]
    .filter(Boolean)
    .join("\n");

  return sendMail({
    to: recipient.email,
    subject: t(kind === "invite" ? "inviteSubject" : "reminderSubject", values),
    text: body,
  });
}

// Latest submission date per person and test, for retest intervals.
async function recentTests(organizationId: string, userIds: string[], testIds: string[]) {
  const submissions = await prisma.testSubmission.findMany({
    where: { organizationId, userId: { in: userIds }, testId: { in: testIds } },
    select: { userId: true, testId: true, createdAt: true },
  });

  const latest = new Map<string, Date>();
  for (const submission of submissions) {
    const key = `${submission.userId}:${submission.testId}`;
    if (!latest.has(key) || latest.get(key)! < submission.createdAt) {
      latest.set(key, submission.createdAt);
    }
  }
  return latest;
}

export type OpenRoundInput = {
  organization: { id: string; name: string };
  name: string;
  purpose: Purpose;
  message: string;
  items: RoundItem[];
  dueAt: Date | null;
  userIds: string[];
  createdById: string;
  scheduleId?: string;
  cycle?: number;
};

export type OpenRoundResult = {
  roundId: string;
  sent: { userId: string; link: string; emailed: boolean }[];
  // People who took a test too recently; they get the rest of the round, or nothing.
  skipped: { userId: string; testIds: string[] }[];
};

// Creates the round, gives each person their items and emails them a sign-in link.
export async function openRound(input: OpenRoundInput): Promise<OpenRoundResult> {
  const round = await prisma.round.create({
    data: {
      organizationId: input.organization.id,
      name: input.name,
      purpose: input.purpose,
      message: input.message,
      items: JSON.stringify(input.items),
      dueAt: input.dueAt,
      scheduleId: input.scheduleId,
      cycle: input.cycle ?? 1,
      createdById: input.createdById,
    },
  });

  return { roundId: round.id, ...(await assignPeople(round, input.organization, input.userIds)) };
}

// Adds people to a round. People already in it are left alone.
export async function assignPeople(
  round: { id: string; name: string; message: string; dueAt: Date | null; items: string },
  organization: { id: string; name: string },
  userIds: string[]
): Promise<Omit<OpenRoundResult, "roundId">> {
  const now = Date.now();
  const items = parseItems(round.items);
  const existing = await prisma.assignment.findMany({ where: { roundId: round.id }, select: { userId: true } });
  const members = await prisma.membership.findMany({
    where: {
      organizationId: organization.id,
      userId: { in: userIds, notIn: existing.map((assignment) => assignment.userId) },
    },
    include: { user: { select: { id: true, email: true, name: true, locale: true } } },
  });

  const retest = await prisma.test.findMany({
    where: { id: { in: items.filter((item) => item.kind === "test").map((item) => item.id) }, retestDays: { gt: 0 } },
    select: { id: true, retestDays: true },
  });
  const latest = retest.length
    ? await recentTests(organization.id, members.map((member) => member.userId), retest.map((test) => test.id))
    : new Map<string, Date>();

  const result: Omit<OpenRoundResult, "roundId"> = { sent: [], skipped: [] };

  for (const member of members) {
    const tooSoon = retest
      .filter((test) => {
        const taken = latest.get(`${member.userId}:${test.id}`);
        return taken && now - taken.getTime() < test.retestDays * DAY;
      })
      .map((test) => test.id);

    const own = items.filter((item) => !(item.kind === "test" && tooSoon.includes(item.id)));

    if (tooSoon.length) {
      result.skipped.push({ userId: member.userId, testIds: tooSoon });
    }
    if (!own.length) {
      continue;
    }

    const assignment = await prisma.assignment.create({
      data: { roundId: round.id, userId: member.userId, items: JSON.stringify(own), invitedAt: new Date() },
    });
    const link = await issueLink(assignment.id, round.dueAt);
    const emailed = await mailAssignment("invite", member.user, organization.name, round, link);
    result.sent.push({ userId: member.userId, link, emailed });
  }

  return result;
}

// Which of each assignment's items already have a submission.
export async function submittedItems(assignmentIds: string[]) {
  const [tests, forms] = await Promise.all([
    prisma.testSubmission.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { assignmentId: true, testId: true, createdAt: true },
    }),
    prisma.formSubmission.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { assignmentId: true, formId: true, createdAt: true },
    }),
  ]);

  const done = new Map<string, Set<string>>();
  const add = (assignmentId: string | null, key: string) => {
    if (!assignmentId) return;
    if (!done.has(assignmentId)) done.set(assignmentId, new Set());
    done.get(assignmentId)!.add(key);
  };
  tests.forEach((submission) => add(submission.assignmentId, `test:${submission.testId}`));
  forms.forEach((submission) => add(submission.assignmentId, `form:${submission.formId}`));

  return done;
}

// Marks the assignment complete once every item has been submitted.
export async function completeIfDone(assignmentId: string) {
  const assignment = await prisma.assignment.findUniqueOrThrow({ where: { id: assignmentId } });
  const done = (await submittedItems([assignmentId])).get(assignmentId) ?? new Set();

  if (!assignment.completedAt && parseItems(assignment.items).every((item) => done.has(itemKey(item)))) {
    // The link has done its job once everything is in.
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { completedAt: new Date(), tokenHash: null, tokenExpiresAt: null },
    });
  }
}

// An open assignment of this person that includes the item, if there is one.
export async function openAssignmentFor(userId: string, organizationId: string, item: RoundItem, assignmentId?: string) {
  const assignments = await prisma.assignment.findMany({
    where: {
      userId,
      completedAt: null,
      ...(assignmentId && { id: assignmentId }),
      round: { organizationId, closedAt: null },
    },
    orderBy: { createdAt: "asc" },
  });

  const candidates = assignments.filter((assignment) =>
    parseItems(assignment.items).some((entry) => itemKey(entry) === itemKey(item))
  );
  if (!candidates.length) {
    return null;
  }

  const done = await submittedItems(candidates.map((assignment) => assignment.id));
  return candidates.find((assignment) => !done.get(assignment.id)?.has(itemKey(item))) ?? null;
}

// People a schedule covers right now: its teams as they are today plus the people picked by hand.
export async function scheduleUserIds(schedule: { organizationId: string; teamIds: string; userIds: string }) {
  const fixed: string[] = JSON.parse(schedule.userIds);
  const teams: string[] = JSON.parse(schedule.teamIds);
  const members = await prisma.membership.findMany({
    where: {
      organizationId: schedule.organizationId,
      role: { not: "candidate" },
      OR: [{ userId: { in: fixed } }, { teamId: { in: teams } }],
    },
    select: { userId: true },
  });
  return Array.from(new Set(members.map((member) => member.userId)));
}

// Opens the next cycle of every schedule that is due.
export async function runSchedules(now = new Date()) {
  const due = await prisma.roundSchedule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    include: { organization: { select: { id: true, name: true } }, _count: { select: { rounds: true } } },
  });

  for (const schedule of due) {
    // Move the date on first, so a failure below can't send the same cycle twice.
    let next = schedule.nextRunAt;
    while (next <= now) {
      next = addMonths(next, schedule.intervalMonths);
    }
    const claimed = await prisma.roundSchedule.updateMany({
      where: { id: schedule.id, nextRunAt: schedule.nextRunAt },
      data: { nextRunAt: next },
    });
    if (!claimed.count) {
      continue;
    }

    await openRound({
      organization: schedule.organization,
      name: schedule.name,
      purpose: schedule.purpose as Purpose,
      message: schedule.message,
      items: parseItems(schedule.items),
      dueAt: new Date(now.getTime() + schedule.dueDays * DAY),
      userIds: await scheduleUserIds(schedule),
      createdById: schedule.createdById,
      scheduleId: schedule.id,
      cycle: schedule._count.rounds + 1,
    });
  }

  return due.length;
}

// One reminder per person, shortly before the due date or once it has passed.
export async function sendReminders(now = new Date()) {
  const assignments = await prisma.assignment.findMany({
    where: {
      completedAt: null,
      remindedAt: null,
      // Not straight after the invitation when the round was sent close to its due date.
      invitedAt: { lt: new Date(now.getTime() - DAY) },
      round: { closedAt: null, dueAt: { not: null, lte: new Date(now.getTime() + REMINDER_DAYS * DAY) } },
    },
    include: {
      user: { select: { id: true, email: true, name: true, locale: true } },
      round: { include: { organization: { select: { name: true } } } },
    },
  });

  for (const assignment of assignments) {
    await sendReminder(assignment);
  }

  return assignments.length;
}

export async function sendReminder(assignment: {
  id: string;
  user: Recipient;
  round: { name: string; message: string; dueAt: Date | null; organization: { name: string } };
}) {
  const link = await issueLink(assignment.id, assignment.round.dueAt);
  const emailed = await mailAssignment("reminder", assignment.user, assignment.round.organization.name, assignment.round, link);
  await prisma.assignment.update({ where: { id: assignment.id }, data: { remindedAt: new Date() } });
  return { link, emailed };
}

export async function cleanupInvitations(now = new Date()) {
  const { count } = await prisma.invitation.deleteMany({ where: { acceptedAt: null, expiresAt: { lt: now } } });
  return count;
}

// Everything that happens on a timer. Runs hourly in the server process and from /api/cron.
export async function runMaintenance(now = new Date()) {
  const schedules = await runSchedules(now);
  const reminders = await sendReminders(now);
  const invitations = await cleanupInvitations(now);
  return { schedules, reminders, invitations };
}

export type ItemInfo = { name: string; minutes: number; questionCount: number; sensitive: boolean };

// Names and sizes of round items in the viewer's language, keyed by itemKey().
export async function describeItems(items: RoundItem[], locale: string) {
  const [tests, forms] = await Promise.all([
    prisma.test.findMany({
      where: { id: { in: items.filter((item) => item.kind === "test").map((item) => item.id) } },
    }),
    prisma.form.findMany({
      where: { id: { in: items.filter((item) => item.kind === "form").map((item) => item.id) } },
      select: { id: true, name: true, description: true, ttc: true, questions: true, translations: true },
    }),
  ]);

  const info = new Map<string, ItemInfo>();
  for (const test of tests) {
    const localized = localizeTest(test, locale);
    info.set(`test:${test.id}`, {
      name: localized.name,
      minutes: test.ttc,
      questionCount: JSON.parse(test.questions).length,
      sensitive: test.sensitive,
    });
  }
  for (const form of forms) {
    const localized = localizeForm(form, locale);
    info.set(`form:${form.id}`, {
      name: localized.name,
      minutes: form.ttc,
      questionCount: JSON.parse(form.questions).length,
      sensitive: false,
    });
  }
  return info;
}

export type RoundProgress = { people: number; completed: number; started: number; overdue: number };

// Per round: how many people it went to, how many finished, and how many have begun.
export async function roundProgress(roundIds: string[]) {
  const assignments = await prisma.assignment.findMany({
    where: { roundId: { in: roundIds } },
    select: { id: true, roundId: true, completedAt: true, round: { select: { dueAt: true, closedAt: true } } },
  });
  const done = await submittedItems(assignments.filter((a) => !a.completedAt).map((a) => a.id));
  const now = new Date();

  const progress = new Map<string, RoundProgress>();
  for (const assignment of assignments) {
    const entry = progress.get(assignment.roundId) ?? { people: 0, completed: 0, started: 0, overdue: 0 };
    entry.people += 1;
    if (assignment.completedAt) {
      entry.completed += 1;
    } else {
      if (done.get(assignment.id)?.size) entry.started += 1;
      if (assignment.round.dueAt && assignment.round.dueAt < now && !assignment.round.closedAt) entry.overdue += 1;
    }
    progress.set(assignment.roundId, entry);
  }
  return progress;
}

// A person's open assignments and when they are next due: the earliest open due date,
// or else the next cycle of a schedule that covers them.
export async function personSchedule(organizationId: string, userId: string, teamId: string | null) {
  const [assignments, schedules] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, completedAt: null, round: { organizationId, closedAt: null } },
      include: { round: { select: { id: true, name: true, dueAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roundSchedule.findMany({
      where: { organizationId, active: true },
      select: { nextRunAt: true, teamIds: true, userIds: true, dueDays: true },
    }),
  ]);

  const done = await submittedItems(assignments.map((assignment) => assignment.id));
  const open = assignments.map((assignment) => ({
    id: assignment.id,
    round: assignment.round,
    done: done.get(assignment.id)?.size ?? 0,
    total: parseItems(assignment.items).length,
  }));

  const dueDates = assignments.flatMap((assignment) => (assignment.round.dueAt ? [assignment.round.dueAt] : []));
  const scheduled = schedules
    .filter((schedule) => {
      const users: string[] = JSON.parse(schedule.userIds);
      const teams: string[] = JSON.parse(schedule.teamIds);
      return users.includes(userId) || (teamId !== null && teams.includes(teamId));
    })
    .map((schedule) => new Date(schedule.nextRunAt.getTime() + schedule.dueDays * DAY));

  const nextDue = [...dueDates, ...scheduled].sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  return { open, nextDue };
}
