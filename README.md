# Prisma

Web app for HR teams to run psychological questionnaires and test instruments, score them, and review results. The interface is available in English and Russian.

## Getting started

```bash
npm ci
cp .env.example .env          # then set ADMIN_PHONE and ADMIN_PASSWORD
npx prisma migrate deploy     # creates the SQLite database
npm run db:seed               # loads the bundled tests and forms, creates the admin
npm run dev
```

Open http://localhost:3000 and sign in with the admin phone number and password.

### Existing databases

Databases created before migrations were added already have every table. Mark the initial migration as applied instead of running it:

```bash
npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy
```

`1_hr_profile` then converts the old profile to the HR one and keeps the data: patronymic becomes middle name, division becomes department, rank becomes position, and Russian group names become group keys. Rank-only, service and address fields are dropped, so back up the database first. Forms and categories already in the database stay as they are; the seed only adds or updates the bundled ones.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npx tsc --noEmit` | Type check |
| `npm run db:seed` | Re-run the seed (safe to repeat) |

## Languages

Interface text lives in `messages/en.json` and `messages/ru.json` (next-intl, no locale in the URL). The locale comes from the `NEXT_LOCALE` cookie set by the language switcher, then the browser's `Accept-Language`, then English. Keep both files with the same keys.

Bundled tests, questionnaires and categories are written in Russian and carry an English overlay in `prisma/seed-data/translations/en/<kind>/<id>.json`, loaded by the seed into each row's `translations` column. The overlay replaces names, instructions, questions, answer options, scale names and result summaries by id, so scoring is unaffected and missing entries fall back to Russian (see `src/utils/content-translation.ts`). The English wording is a working translation, not a validated or licensed edition of each instrument. "Pattern Finding" keeps its Russian words because the task depends on their spelling. Spreadsheet import templates keep their Russian column headers.

Tests and forms retired in the move away from military use are kept in `prisma/seed-data/retired/`. The seed does not load them.

## Design

Colours are CSS variables in `src/app/globals.css` (light and dark), fonts are Inter for text and Manrope for headings (`src/app/layout.tsx`), and the logo is `src/components/ui/logo.tsx`. Dashboard pages start with `PageHeader`; respondent screens are built for phones first, with one question per screen and a Back button (`src/components/runner/`).

## Groups

People are sorted into groups stored as keys (`general`, `monitoring`, `risk`, `suicide-risk`, `substance-risk`), defined in `src/utils/groups.ts`. Labels come from the `groups` messages.

## Access rules

- Signed-out visitors can only see the landing page, the privacy notice (`/privacy`) and the sign-in and sign-up pages.
- Respondents must accept the privacy notice before taking anything. Sign-up asks for it, and accounts created earlier are sent to `/consent` once. The date is stored in `User.consentedAt` (migration `3_consent`). The notice text is in the `privacy` messages; adjust it to your organisation before going live.
- `/forms` and `/tests` need a signed-in user; `/dashboard` needs an admin.
- Every server action checks the session itself with `requireUser()` or `requireAdmin()` from `src/utils/authentication.ts`. Keep doing this in new actions: the middleware only checks that a cookie exists.
- Data sent to the browser uses `publicUserSelect` from `src/utils/user.ts`, which leaves out the password hash and recovery answer.

## Scoring

Test submissions are scored on the server when they are saved (`src/utils/scoring.ts`). Formulas in imported spreadsheets are evaluated with `fparser`, never `eval`.
