-- Per-locale overlays for bundled content, e.g. {"en": {...}}
ALTER TABLE "Category" ADD COLUMN "translations" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Form" ADD COLUMN "translations" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Test" ADD COLUMN "translations" TEXT NOT NULL DEFAULT '{}';
