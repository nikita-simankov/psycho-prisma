import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import categories from "./seed-data/categories.json";
import forms from "./seed-data/forms.json";
import tests from "./seed-data/tests.json";

const prisma = new PrismaClient();

const TRANSLATIONS_DIR = path.join(__dirname, "seed-data", "translations");

// Collects seed-data/translations/<locale>/<kind>/<id>.json into { <locale>: overlay }.
function loadTranslations(kind: "tests" | "forms" | "categories", id: string): string {
  const translations: Record<string, unknown> = {};

  if (existsSync(TRANSLATIONS_DIR)) {
    for (const locale of readdirSync(TRANSLATIONS_DIR)) {
      const file = path.join(TRANSLATIONS_DIR, locale, kind, `${id}.json`);

      if (existsSync(file)) {
        translations[locale] = JSON.parse(readFileSync(file, "utf8"));
      }
    }
  }

  return JSON.stringify(translations);
}

// Same rule as organizationNameKey in src/utils/organizations.ts.
function nameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

// Migration 5 could only lowercase ASCII; this folds every script, skipping any clash.
async function normalizeOrganizationNameKeys() {
  for (const organization of await prisma.organization.findMany({ select: { id: true, name: true, nameKey: true } })) {
    const key = nameKey(organization.name);

    if (key !== organization.nameKey && !(await prisma.organization.findFirst({ where: { nameKey: key } }))) {
      await prisma.organization.update({ where: { id: organization.id }, data: { nameKey: key } });
    }
  }
}

// Loads the bundled instruments and questionnaires, and creates the first owner and
// their organization from ADMIN_EMAIL, ADMIN_PASSWORD and ORGANIZATION_NAME. Safe to run more than once.
async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: { ...category, translations: loadTranslations("categories", category.id) },
      update: { name: category.name, translations: loadTranslations("categories", category.id) },
    });
  }

  for (const { categoryIds, scales, questions, stanTable, tGradeTable, summaryTable, ...test } of tests) {
    const data = {
      ...test,
      scales: JSON.stringify(scales),
      questions: JSON.stringify(questions),
      stanTable: JSON.stringify(stanTable),
      tGradeTable: JSON.stringify(tGradeTable),
      summaryTable: JSON.stringify(summaryTable),
      translations: loadTranslations("tests", test.id),
      categories: { set: categoryIds.map((id) => ({ id })) },
    };

    await prisma.test.upsert({
      where: { id: test.id },
      create: { ...data, categories: { connect: categoryIds.map((id) => ({ id })) } },
      update: data,
    });
  }

  for (const { categoryIds, questions, ...form } of forms) {
    const data = {
      ...form,
      questions: JSON.stringify(questions),
      translations: loadTranslations("forms", form.id),
      categories: { set: categoryIds.map((id) => ({ id })) },
    };

    await prisma.form.upsert({
      where: { id: form.id },
      create: { ...data, categories: { connect: categoryIds.map((id) => ({ id })) } },
      update: data,
    });
  }

  await normalizeOrganizationNameKeys();

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping the first account");
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      id: randomUUID(),
      name: "Admin",
      lastName: "Admin",
      email,
      password: await hash(password, 10),
      // The operator chose this address in the environment, so it counts as confirmed.
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  // The first account owns an organization; people are invited from there.
  if (!(await prisma.membership.findFirst({ where: { userId: user.id } }))) {
    const requested = process.env.ORGANIZATION_NAME?.trim().replace(/\s+/g, " ") || "My organization";
    let name = requested;
    for (let suffix = 2; await prisma.organization.findFirst({ where: { nameKey: nameKey(name) } }); suffix++) {
      name = `${requested} (${suffix})`;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "organization";

    await prisma.organization.create({
      data: {
        name,
        nameKey: nameKey(name),
        slug: (await prisma.organization.findUnique({ where: { slug } })) ? `${slug}-${Date.now()}` : slug,
        memberships: { create: { userId: user.id, role: "owner", consentedAt: new Date() } },
      },
    });
  }

  console.log(`Owner account ready for ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
