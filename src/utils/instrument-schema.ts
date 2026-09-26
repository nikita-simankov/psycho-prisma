import { z } from "zod";
import { STRATEGIES } from "./instrument-content";

// Shape checks for content sent from the studio. Whether the content is complete enough to
// publish is validateTestContent / validateFormContent's job.
const id = z.number().int().min(0).max(100_000);
const text = (max: number) => z.string().max(max);
const number = z.number().finite().min(-100_000).max(100_000);

const choice = z.object({ id, text: text(1000) });

export const testContentSchema = z.object({
  name: text(200),
  description: text(5000),
  instruction: text(5000),
  ttc: z.number().int().min(0).max(600),
  strategy: z.enum(STRATEGIES),
  questions: z.array(z.object({ id, text: text(2000), type: text(20), choices: z.array(choice).max(20) })).max(1000),
  scales: z
    .array(
      z.object({
        id,
        name: text(200),
        keys: z.array(z.object({ questionId: id, choiceId: id, grade: number })).max(20_000),
        multiplier: number,
        correction: number,
        resultCalculationFormula: text(500),
        validity: z.object({ measure: z.enum(["grade", "stan", "tGrade"]), max: number.optional() }).optional(),
      })
    )
    .max(100),
  stanTable: z.array(z.object({ scaleId: id, minGrade: number, maxGrade: number, stanValue: number })).max(5000),
  tGradeTable: z.array(z.object({ scaleId: id, rawGrade: number, convertedGrade: number })).max(20_000),
  summaryTable: z
    .array(
      z.object({
        scaleId: id,
        strategy: text(20),
        minGrade: number,
        maxGrade: number,
        minTGrade: number,
        maxTGrade: number,
        minStanValue: number,
        maxStanValue: number,
        summaryText: text(5000),
      })
    )
    .max(5000),
});

export const formContentSchema = z.object({
  name: text(200),
  description: text(5000),
  ttc: z.number().int().min(0).max(600),
  adminOnly: z.boolean(),
  questions: z
    .array(z.object({ id, text: text(2000), type: z.enum(["Text", "List"]), choices: z.array(choice).max(50) }))
    .max(500),
});
