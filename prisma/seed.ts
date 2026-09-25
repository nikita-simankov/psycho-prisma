import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import categories from "./seed-data/categories.json";
import forms from "./seed-data/forms.json";
import tests from "./seed-data/tests.json";

const prisma = new PrismaClient();

// Loads the bundled instruments and questionnaires, and creates the first admin
// from ADMIN_PHONE and ADMIN_PASSWORD. Safe to run more than once.
async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: category,
      update: { name: category.name },
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
      categories: { set: categoryIds.map((id) => ({ id })) },
    };

    await prisma.form.upsert({
      where: { id: form.id },
      create: { ...data, categories: { connect: categoryIds.map((id) => ({ id })) } },
      update: data,
    });
  }

  const phoneNumber = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!phoneNumber || !password) {
    console.log("ADMIN_PHONE or ADMIN_PASSWORD not set, skipping admin account");
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  await prisma.user.upsert({
    where: { phoneNumber },
    create: {
      id: randomUUID(),
      role: "admin",
      name: "Admin",
      lastName: "Admin",
      phoneNumber,
      password: await hash(password, 10),
    },
    update: { role: "admin" },
  });

  console.log(`Admin account ready for ${phoneNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
