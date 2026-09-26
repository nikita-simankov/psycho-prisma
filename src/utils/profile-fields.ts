import { z } from "zod";

export const EMPLOYMENT_TYPES = ["fullTime", "partTime", "contract", "intern"] as const;
export const CUSTOM_FIELD_TYPES = ["text", "number", "date", "select"] as const;

// A profile field an organization defines for its people, such as "Shift" or "Grade".
export const customFieldSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_]{1,40}$/),
    label: z.string().trim().min(1).max(60),
    type: z.enum(CUSTOM_FIELD_TYPES),
    // Choices for "select" fields.
    options: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  })
  .strict();

export type CustomField = z.infer<typeof customFieldSchema>;

export const customFieldsSchema = z
  .array(customFieldSchema)
  .max(20)
  .refine((fields) => new Set(fields.map((field) => field.key)).size === fields.length, "Duplicate key");

export function parseCustomFields(value: string): CustomField[] {
  try {
    const parsed = customFieldsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

export function parseCustomValues(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).filter(([, entry]) => typeof entry === "string")) as Record<string, string>
      : {};
  } catch {
    return {};
  }
}

// Keeps only values for fields that exist and that fit the field's type.
export function cleanCustomValues(fields: CustomField[], values: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const field of fields) {
    const value = (values[field.key] ?? "").trim().slice(0, 200);
    if (!value) continue;
    if (field.type === "number" && !/^-?\d+(\.\d+)?$/.test(value)) continue;
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
    if (field.type === "select" && !field.options.includes(value)) continue;
    clean[field.key] = value;
  }
  return clean;
}

// A readable key from a label, for new custom fields.
export function fieldKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "field";
  let key = base;
  for (let i = 2; taken.includes(key); i++) key = `${base}_${i}`;
  return key;
}
