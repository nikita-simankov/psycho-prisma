// Bundled tests, forms and categories are written in Russian. Other languages are
// stored as overlays in each row's `translations` column, keyed by locale:
//
//   { "en": { "name": "...", "questions": { "1": { "text": "...", "choices": { "1": "..." } } },
//             "scales": { "1": "..." }, "summaries": { "<original text>": "..." } } }
//
// Anything missing from an overlay falls back to the original text, so ids,
// keys and scoring never change.

type QuestionOverlay = { text?: string; choices?: Record<string, string> };

export type ContentOverlay = {
  name?: string;
  description?: string;
  instruction?: string;
  questions?: Record<string, QuestionOverlay>;
  scales?: Record<string, string>;
  summaries?: Record<string, string>;
};

type Translatable = { translations: string };

function getOverlay(item: Translatable, locale: string): ContentOverlay | null {
  try {
    const translations = JSON.parse(item.translations) as Record<string, ContentOverlay>;
    return translations[locale] ?? null;
  } catch {
    return null;
  }
}

type RawQuestion = { id: number; text: string; choices?: { id: number; text: string }[] };

function translateQuestions(questions: string, overlay: ContentOverlay): string {
  if (!overlay.questions) {
    return questions;
  }

  const parsed = JSON.parse(questions) as RawQuestion[];

  return JSON.stringify(
    parsed.map((question) => {
      const translated = overlay.questions?.[question.id];

      if (!translated) {
        return question;
      }

      return {
        ...question,
        text: translated.text ?? question.text,
        choices: question.choices?.map((choice) => ({
          ...choice,
          text: translated.choices?.[choice.id] ?? choice.text,
        })),
      };
    })
  );
}

function translateText<T extends { name: string; description: string }>(
  item: T,
  overlay: ContentOverlay
): T {
  return {
    ...item,
    name: overlay.name ?? item.name,
    description: overlay.description ?? item.description,
  };
}

export function localizeCategory<T extends Translatable & { name: string }>(category: T, locale: string): T {
  const overlay = getOverlay(category, locale);
  return overlay?.name ? { ...category, name: overlay.name } : category;
}

type LocalizableForm = Translatable & {
  name: string;
  description: string;
  questions: string;
  categories?: (Translatable & { name: string })[];
};

export function localizeForm<T extends LocalizableForm>(form: T, locale: string): T {
  const categories = form.categories?.map((category) => localizeCategory(category, locale));
  const overlay = getOverlay(form, locale);

  if (!overlay) {
    return categories ? { ...form, categories } : form;
  }

  return {
    ...translateText(form, overlay),
    questions: translateQuestions(form.questions, overlay),
    ...(categories && { categories }),
  };
}

type LocalizableTest = LocalizableForm & {
  instruction: string;
  scales: string;
  summaryTable: string;
};

export function localizeTest<T extends LocalizableTest>(test: T, locale: string): T {
  const categories = test.categories?.map((category) => localizeCategory(category, locale));
  const overlay = getOverlay(test, locale);

  if (!overlay) {
    return categories ? { ...test, categories } : test;
  }

  const scales = (JSON.parse(test.scales) as { id: number; name: string }[]).map((scale) => ({
    ...scale,
    name: overlay.scales?.[scale.id] ?? scale.name,
  }));
  const summaryTable = (JSON.parse(test.summaryTable) as { summaryText: string }[]).map((row) => ({
    ...row,
    summaryText: overlay.summaries?.[row.summaryText] ?? row.summaryText,
  }));

  return {
    ...translateText(test, overlay),
    instruction: overlay.instruction ?? test.instruction,
    questions: translateQuestions(test.questions, overlay),
    scales: JSON.stringify(scales),
    summaryTable: JSON.stringify(summaryTable),
    ...(categories && { categories }),
  };
}

type StoredEntry = { scale?: { id: number; name: string }; summary?: string } | null;

// Results are stored in the original language; this translates scale names and
// summaries on the way out.
export function localizeResult(result: unknown[], test: Translatable, locale: string): unknown[] {
  const overlay = getOverlay(test, locale);

  if (!overlay) {
    return result;
  }

  return (result as StoredEntry[]).map((entry) =>
    entry?.scale
      ? {
          ...entry,
          scale: { ...entry.scale, name: overlay.scales?.[entry.scale.id] ?? entry.scale.name },
          summary: entry.summary && (overlay.summaries?.[entry.summary] ?? entry.summary),
        }
      : entry
  );
}
