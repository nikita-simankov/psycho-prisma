import "server-only";

import type { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { getTranslations } from "next-intl/server";
import { prisma } from "./database";
import { SAMPLE_EMAIL_DOMAIN } from "./mail";
import { organizationDeletion, uniqueSlug } from "./organizations";
import { scoreSubmission } from "./scoring";

// A demo organization with 40 fictional people, finished rounds and results, so a new owner can
// see reports and analytics before they have data of their own. Its people can't sign in (their
// password is random and never stored) and are never emailed (SAMPLE_EMAIL_DOMAIN).

const LEADERSHIP = "a4d5d8eb-76e1-4ced-b534-5cbee4b5f8c2";
const COMMUNICATION = "f80c5f1e-6ca0-4c2b-bb98-50d3275f4c43";
const ANALOGIES = "3f57e760-9261-4d7c-8154-635bf0b4dc4e";
const PEOPLE = 40;
const DAY = 24 * 60 * 60_000;

const FIRST = ["Anna", "Ben", "Chloe", "David", "Elena", "Farid", "Grace", "Hugo", "Iris", "Jonas", "Kira", "Leo", "Maya", "Nikolai", "Olivia", "Pavel", "Quinn", "Rosa", "Samir", "Tara"];
const LAST = ["Berg", "Costa", "Doyle", "Ivanova", "Kowalski", "Lindqvist", "Moreau", "Novak", "Okafor", "Petrov", "Rossi", "Sato", "Vogel", "Walsh"];

// The same workspace every time: a small seeded random generator instead of Math.random.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

type Question = { id: number; choices: { id: number }[] };

// Answers that lean one way per person, so the group spreads out like real results.
function answers(questions: Question[], lean: number, next: () => number) {
  return questions.map((question) => {
    const count = question.choices.length;
    const index = Math.min(count - 1, Math.max(0, Math.floor((lean + (next() - 0.5) * 0.9) * count)));
    return { questionId: question.id, choiceId: question.choices[index].id };
  });
}

export async function createSampleWorkspace(ownerId: string) {
  const t = await getTranslations("sample");
  const name = t("name");
  const organization = await prisma.organization.create({
    data: {
      name,
      nameKey: name.toLocaleLowerCase(),
      slug: await uniqueSlug(name),
      isSample: true,
      goal: "development",
      privacyContact: t("privacyContact"),
      memberships: { create: { userId: ownerId, role: "owner", consentedAt: new Date(), welcomedAt: new Date() } },
      // Business, and never billed: nothing here is real.
      subscription: { create: { plan: "business", status: "active", currentPeriodEnd: new Date("2099-12-31") } },
    },
  });

  const teamNames = [t("teams.sales"), t("teams.support"), t("teams.engineering"), t("teams.operations")];
  const teams = await Promise.all(teamNames.map((teamName) => prisma.team.create({ data: { name: teamName, organizationId: organization.id } })));
  const positions = [t("positions.sales"), t("positions.support"), t("positions.engineering"), t("positions.operations")];

  const next = random(20260926);
  const password = await hash(randomBytes(24).toString("base64url"), 10);
  const prefix = organization.id.slice(0, 8);
  const people: { id: string; team: number; lean: number }[] = [];
  const users: Prisma.UserCreateManyInput[] = [];
  const memberships: Prisma.MembershipCreateManyInput[] = [];

  for (let i = 0; i < PEOPLE; i++) {
    const id = randomUUID();
    const team = i % teams.length;
    const joined = new Date(Date.now() - (60 + Math.floor(next() * 900)) * DAY);
    users.push({
      id,
      email: `sample-${prefix}-${i}${SAMPLE_EMAIL_DOMAIN}`,
      name: FIRST[i % FIRST.length],
      lastName: LAST[(i * 7) % LAST.length],
      password,
      emailVerifiedAt: new Date(),
    });
    memberships.push({
      userId: id,
      organizationId: organization.id,
      role: "member",
      teamId: teams[team].id,
      position: positions[team],
      startDate: joined.toISOString().slice(0, 10),
      consentedAt: joined,
      welcomedAt: joined,
    });
    // Teams differ a little on average, people a lot.
    people.push({ id, team, lean: Math.min(0.9, Math.max(0.1, 0.35 + team * 0.08 + (next() - 0.5) * 0.5)) });
  }

  await prisma.user.createMany({ data: users });
  await prisma.membership.createMany({ data: memberships });

  const tests = await prisma.test.findMany({ where: { id: { in: [LEADERSHIP, COMMUNICATION, ANALOGIES] } } });
  const byId = new Map(tests.map((test) => [test.id, test]));

  // Two finished development rounds a quarter apart, and a reasoning round still running.
  const rounds = [
    { name: t("rounds.spring"), items: [LEADERSHIP, COMMUNICATION], daysAgo: 180, share: 1, open: false, teamsIn: [0, 1, 2, 3] },
    { name: t("rounds.summer"), items: [LEADERSHIP, COMMUNICATION], daysAgo: 90, share: 0.85, open: false, teamsIn: [0, 1, 2, 3] },
    { name: t("rounds.reasoning"), items: [ANALOGIES], daysAgo: 6, share: 0.6, open: true, teamsIn: [1, 2] },
  ];

  for (const [index, spec] of rounds.entries()) {
    const available = spec.items.filter((id) => byId.has(id));
    if (!available.length) continue;
    const items = available.map((id) => ({ kind: "test", id }));
    const createdAt = new Date(Date.now() - spec.daysAgo * DAY);
    const round = await prisma.round.create({
      data: {
        organizationId: organization.id,
        name: spec.name,
        purpose: "development",
        items: JSON.stringify(items),
        createdById: ownerId,
        createdAt,
        dueAt: spec.open ? new Date(Date.now() + 10 * DAY) : new Date(createdAt.getTime() + 14 * DAY),
      },
    });

    for (const person of people.filter((p) => spec.teamsIn.includes(p.team))) {
      const finished = next() < spec.share;
      const answeredAt = new Date(createdAt.getTime() + (1 + Math.floor(next() * 10)) * DAY);
      const assignment = await prisma.assignment.create({
        data: {
          roundId: round.id,
          userId: person.id,
          items: JSON.stringify(items),
          invitedAt: createdAt,
          completedAt: finished ? answeredAt : null,
          createdAt,
        },
      });
      if (!finished) continue;

      // People drift a little between rounds, so trends have something to show.
      const lean = Math.min(0.95, Math.max(0.05, person.lean + (index - 0.5) * 0.04 + (next() - 0.5) * 0.08));
      await prisma.testSubmission.createMany({
        data: available.map((testId) => {
          const test = byId.get(testId)!;
          const responses = answers(JSON.parse(test.questions) as Question[], lean, next);
          const score = scoreSubmission(test, responses);
          return {
            organizationId: organization.id,
            userId: person.id,
            testId,
            testVersion: test.version,
            assignmentId: assignment.id,
            summary: score ? JSON.stringify(score.result) : "",
            submission: JSON.stringify(responses),
            createdAt: answeredAt,
          };
        }),
      });
    }
  }

  return organization;
}

// Deletes a sample workspace and its fictional people.
export async function deleteSampleWorkspace(organizationId: string) {
  const fictional = await prisma.membership.findMany({
    where: { organizationId, user: { email: { endsWith: SAMPLE_EMAIL_DOMAIN } } },
    select: { userId: true },
  });
  await prisma.$transaction([
    ...organizationDeletion(organizationId),
    prisma.user.deleteMany({ where: { id: { in: fictional.map((m) => m.userId) } } }),
  ]);
}
