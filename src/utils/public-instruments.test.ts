import { describe, expect, it } from "vitest";
import tests from "../../prisma/seed-data/tests.json";
import { PUBLIC_INSTRUMENTS } from "./public-instruments";

type SeedTest = { id: string; ttc: number; sensitive: boolean; questions: unknown };

describe("public instruments", () => {
  it("match the shared library and leave clinical instruments out", () => {
    for (const instrument of PUBLIC_INSTRUMENTS) {
      const test = (tests as SeedTest[]).find((t) => t.id === instrument.testId);
      expect(test, instrument.slug).toBeDefined();
      const questions = typeof test!.questions === "string" ? JSON.parse(test!.questions) : test!.questions;
      expect(test!.sensitive, instrument.slug).toBe(false);
      expect(questions.length, instrument.slug).toBe(instrument.questions);
      expect(test!.ttc, instrument.slug).toBe(instrument.minutes);
    }
  });

  it("have unique slugs", () => {
    const slugs = PUBLIC_INSTRUMENTS.map((instrument) => instrument.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
