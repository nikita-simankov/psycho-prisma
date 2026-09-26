import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import { ANALOGIES, BULK_RESULTS, MEMBER, ORG, OWNER, PASSWORD } from "./fixtures";

// Wipes the database in DATABASE_URL and loads the fixtures the end-to-end suite expects.
// Refuses to run unless the database name mentions "e2e" or "test", so it can't hit real data.
const url = process.env.DATABASE_URL ?? "";
const name = url.split("?")[0].split("/").pop() ?? "";

if (!/e2e|test/i.test(name)) {
  console.error(`Refusing to reset "${name || url}": point DATABASE_URL at a database named *e2e* or *test*.`);
  process.exit(1);
}

const env = { ...process.env, ADMIN_EMAIL: OWNER, ADMIN_PASSWORD: PASSWORD, ORGANIZATION_NAME: "Acme Ltd" };
execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit", env });
execSync("npx prisma db seed", { stdio: "inherit", env });

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.findUniqueOrThrow({ where: { slug: ORG } });
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: OWNER } });
  const sales = await prisma.team.create({ data: { name: "Sales", organizationId: organization.id } });

  const member = await prisma.user.create({
    data: { id: randomUUID(), email: MEMBER, name: "Ann", lastName: "Tester", password: owner.password },
  });
  await prisma.membership.create({
    data: { userId: member.id, organizationId: organization.id, role: "member", teamId: sales.id, consentedAt: new Date() },
  });

  // Enough people with a result for the people list and the results list to need a second page.
  const test = await prisma.test.findUniqueOrThrow({ where: { id: ANALOGIES } });
  const questions: { id: number; choices: { id: number }[] }[] = JSON.parse(test.questions);
  const submission = JSON.stringify(questions.map((q) => ({ questionId: q.id, choiceId: q.choices[0].id })));

  for (let i = 0; i < BULK_RESULTS; i++) {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `bulk${i}@acme.test`,
        name: `Bulk${i}`,
        lastName: `Person${String(i).padStart(2, "0")}`,
        password: owner.password,
      },
    });
    await prisma.membership.create({
      data: { userId: user.id, organizationId: organization.id, role: "member", consentedAt: new Date() },
    });
    await prisma.testSubmission.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        testId: test.id,
        submission,
        summary: "",
        createdAt: new Date(Date.now() - i * 60_000),
      },
    });
  }
}

main()
  .then(() => console.log("e2e database ready"))
  .finally(() => prisma.$disconnect());
