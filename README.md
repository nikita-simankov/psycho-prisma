# Calibre

Web app for HR teams to run psychological questionnaires and test instruments, score them, and review results. The interface is available in English and Russian.

## Getting started

```bash
npm ci
cp .env.example .env          # then set ADMIN_EMAIL and ADMIN_PASSWORD
docker compose up -d          # local Postgres (or point DATABASE_URL at your own)
npx prisma migrate deploy     # creates the tables
npm run db:seed               # loads the bundled tests and forms, creates the owner and organization
npm run dev
```

Node 22 or later is needed (Next 16 needs 20.9, and the SQLite copy script below uses Node's built-in SQLite).

Open http://localhost:3000 and sign in with the owner email and password. Anyone can also sign up, which creates a new organization they own.

### Moving from SQLite

Until this release the app ran on SQLite. The database is now Postgres, with a single fresh migration (`prisma/migrations/0_init`). To bring an existing SQLite database across:

1. Back up the SQLite file.
2. Create an empty Postgres database and apply the schema: `DATABASE_URL=postgresql://... npx prisma migrate deploy`.
3. Copy the data before the app's first start (which would seed the empty database): `DATABASE_URL=postgresql://... npm run db:copy-sqlite -- /path/to/prisma.db`.

The copy script (`scripts/copy-sqlite-to-postgres.ts`) never changes the SQLite file. It works on a temporary copy, applies any SQLite migrations that copy is missing from `prisma/sqlite-migrations`, then copies every table in one transaction. It stops if Postgres already has data; add `--replace` to empty it first. A database from before migrations existed (no `_prisma_migrations` table) has to be upgraded once with the previous release first. On Railway, run it from your computer against the Postgres service's public URL, or with `railway run`.

The SQLite migrations are kept in `prisma/sqlite-migrations` for that upgrade and as a record of how older databases changed:

`1_hr_profile` converts the old profile to the HR one and keeps the data: patronymic becomes middle name, division becomes department, rank becomes position, and Russian group names become group keys. Rank-only, service and address fields are dropped, so back up the database first. Forms and categories already in the database stay as they are; the seed only adds or updates the bundled ones.

`4_organizations` moves everyone into one organization called "My organization" (rename it in Settings). Former admins become psychologists and the earliest of them becomes the owner; everyone else becomes a member. Departments become teams, groups other than `general` become follow-up flags, and all submissions and conclusions belong to that organization. Accounts keep signing in with their phone number and can add an email later.

`5_unique_organization_names` makes organization names unique, compared without case or extra spaces. If two organizations already share a name, the older one keeps it and the others get " (2)", " (3)" and so on; rename them in Settings afterwards. An organization whose address is still the placeholder `/default` gets a real one the first time it is renamed.

`6_rounds` adds assessment rounds (`Round`, `Assignment`, `RoundSchedule`), links submissions to the round they answer, and adds `Test.retestDays` and `User.locale`.

`7_drafts` adds `Draft`, which keeps answers in progress so people can pause and resume on any device, and a `timings` column on submissions with the milliseconds spent on each answer.

`8_reports` adds `ReportVersion` (numbered, frozen copies of a person's report), `TestSubmission.locale` and `Organization.feedbackTestIds`. Conclusions saved in the old archive become version 1 of each person's report.

`9_profiles` adds work details to `Membership` (manager, start date, location, employment type, tags, custom field values), `Organization.customFields` and `AnalyticsView` (saved analytics filters).

`9a_privacy` adds `AuditEvent` and the retention settings on `Organization`.

`9b_studio` adds `version`, `draft` and `copiedFromId` to `Test` and `Form`, the version answered to `TestSubmission` and `FormSubmission`, and `InstrumentVersion`. It drops the global unique index on test and questionnaire names: names are now unique among what one organization sees (the shared library and its own instruments), checked when publishing. Existing rows become version 1.

## Deploying to Railway

The repository deploys to [Railway](https://railway.com) as is: `railway.json` builds the `Dockerfile` and checks `/api/health` before switching traffic. Each start applies migrations and re-runs the seed, which is safe to repeat.

1. Create a project from this GitHub repository.
2. Add a PostgreSQL database to the project (New > Database > PostgreSQL). Keep the app at one replica: the hourly rounds and retention job runs inside it.
3. Set these variables on the app service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a reference to the database service) |
| `APP_URL` | The public address, e.g. `https://prisma.up.railway.app` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first owner, created on the first start |
| `ORGANIZATION_NAME` | That owner's organization |
| `RESEND_API_KEY`, `MAIL_FROM` | Email for invitations and password resets (optional) |

4. Generate a domain under Settings > Networking. Railway serves it over HTTPS, which the session cookie needs in production.

An existing deployment on SQLite keeps its data on the volume until you move it. Download the file first (for example with `railway ssh`), then follow [Moving from SQLite](#moving-from-sqlite) against the new Postgres database before switching `DATABASE_URL`. Remove the volume once the data is across.

The same image runs on any Docker host with a Postgres database: `docker build -t prisma .` then `docker run -p 3000:3000 -e DATABASE_URL=postgresql://... ... prisma`.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npx tsc --noEmit` | Type check |
| `npm test` | Unit tests (Vitest: scoring snapshots of every bundled instrument, the studio schema) |
| `npm run test:e2e` | End-to-end tests (Playwright, see below) |
| `npm run db:seed` | Re-run the seed (safe to repeat) |
| `npm run db:copy-sqlite -- file.db` | Copy an old SQLite database into Postgres (see above) |

## End-to-end tests

`npm run test:e2e` wipes the database in `DATABASE_URL`, loads the library and the fixtures in `e2e/prepare-db.ts` (an owner, a respondent in a Sales team, 55 people with an Analogies result), then drives a production build on port 3100 with Playwright: public pages and search-engine headers, sign-in, the studio, a round from the owner to the respondent, and pagination. It refuses to run unless the database is named `*e2e*` or `*test*`. Build first:

```bash
docker compose up -d   # or any Postgres
docker compose exec postgres createdb -U prisma e2e
export DATABASE_URL=postgresql://prisma:prisma@localhost:5432/e2e
npm run build && npx playwright install chromium && npm run test:e2e
```

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`: lint, type check, unit tests, a check that the migrations match `schema.prisma`, the build and the end-to-end tests against a Postgres service. A failed run uploads the Playwright report and traces.

## Search engines

Only the landing page, the privacy notice, sign-in and sign-up are meant to be found: `robots.txt` and `sitemap.xml` list them (`src/utils/site.ts`), and every other page is sent with `X-Robots-Tag: noindex` by `src/proxy.ts`. Links in the sitemap, canonical tags and the sharing preview (`src/app/opengraph-image.tsx`) use `APP_URL`, so set it in production.

Long lists (test and questionnaire results, closed rounds, the audit log) are paginated on the server, 50 to a page with `?page=`; the people and reports tables page through the organization's members in the browser.

## Languages

Interface text lives in `messages/en.json` and `messages/ru.json` (next-intl, no locale in the URL). The locale comes from the `NEXT_LOCALE` cookie set by the language switcher, then the browser's `Accept-Language`, then English. Keep both files with the same keys.

Bundled tests, questionnaires and categories are written in Russian and carry an English overlay in `prisma/seed-data/translations/en/<kind>/<id>.json`, loaded by the seed into each row's `translations` column. The overlay replaces names, instructions, questions, answer options, scale names and result summaries by id, so scoring is unaffected and missing entries fall back to Russian (see `src/utils/content-translation.ts`). The English wording is a working translation, not a validated or licensed edition of each instrument. "Pattern Finding" keeps its Russian words because the task depends on their spelling. Spreadsheet import templates keep their Russian column headers.

Tests and forms retired in the move away from military use are kept in `prisma/seed-data/retired/`. The seed does not load them.

## Design

Styling is Tailwind 4, configured in CSS: design tokens live in `src/app/globals.css` in three layers (primitives, semantic tokens per light/dark theme, and the `@theme` block that generates utilities). Fonts are Onest for the interface, Literata for headings and JetBrains Mono for data (`src/app/layout.tsx`). Signed-in users can open `/design` to see every token and base component in both themes, and the logo is `src/components/ui/logo.tsx`. Staff pages live under `src/app/[org]/` inside an inset sidebar (`src/components/ui/sidebar.tsx`, groups in `src/app/[org]/components/navigation.ts`) with breadcrumbs and a Ctrl+K search. They start with `PageHeader`, which also names the last breadcrumb, and share `loading.tsx`, `error.tsx`, `not-found.tsx` and `EmptyState`; respondent screens are built for phones first, with one question per screen and a Back button (`src/components/runner/`).

## Organizations and roles

Each organization has its own people, teams, results and uploaded instruments; one account can belong to several and switch between them in the sidebar. Staff pages carry the organization's slug in the address (`/acme-ltd/people`), so a shared link always opens the right organization; the proxy (`src/proxy.ts`, formerly middleware) passes the slug to the server in the `x-organization` header and also remembers it in the `active_org` cookie for pages outside the slug, such as `/forms` and `/tests` for respondents. Old `/dashboard/...` links redirect to the matching page. Opening another organization's slug shows "not found". Bundled instruments (`organizationId` null) are shared by every organization.

Organization names are unique regardless of case and spacing (`Organization.nameKey`). Owners can transfer ownership (they become an admin) and delete the organization after typing its name, under Settings. Everyone can change their name, email and password and leave an organization on the account page (`/account`); the last owner has to transfer ownership first.

| Role | Can |
| --- | --- |
| Owner | Everything, including settings and assigning owners |
| Admin | Manage people, teams, invitations, settings and the instrument library |
| Psychologist | Manage the library, see restricted instruments and follow-up flags, write conclusions |
| HR manager | See the dashboard, send rounds, and team averages for groups of five or more (no individual results) |
| Member | Take assigned questionnaires and tests |

Permissions are defined in `src/utils/roles.ts`. People join through invitation links (valid 7 days, only a hash of the token is stored). Links are emailed when `RESEND_API_KEY` is set and can always be copied from the People page. Password reset works the same way.

Follow-up flags (`monitoring`, `risk`, `suicide-risk`, `substance-risk`, in `src/utils/flags.ts`) are only visible to owners and psychologists.

Clinical instruments are marked `sensitive` in `prisma/seed-data/tests.json`: members don't see them and HR managers and admins don't see their results. Only Communication and Organizational Tendencies, Analogies, Mental Arithmetic, Leadership Tendency, Pattern Finding and Risk Readiness (Schubert) are unrestricted. Change the flag in that file and re-run the seed to adjust. Check licensing before using HADS, BDI or the Mini-Mult commercially.

## Rounds

Staff send work in rounds (`/[org]/rounds`): chosen tests and questionnaires, a purpose (development, hiring or wellbeing), people or teams, an optional due date and message. Everyone in the round gets an email with a personal link (`/r/<token>`) that signs them in and opens their list at `/assessments`; respondents only see and can answer what was sent to them. Staff can copy a person's link, remind them, add people and close the round. Hiring rounds can include candidates (a `candidate` role that sees nothing else) and never include clinical screens.

A round can repeat every 1, 3, 6 or 12 months. Each cycle goes to the chosen people plus whoever is in the chosen teams at that time. Tests with `retestDays` in `tests.json` (the ability tests, 180 days) are left out for people who took them more recently. The server opens due cycles, sends one reminder two days before the due date and deletes expired invitations every hour (`src/instrumentation.ts`). To run this from an outside scheduler instead, set `DISABLE_SCHEDULER=1` and `POST /api/cron` with `Authorization: Bearer $CRON_SECRET`. Scheduled emails need `APP_URL` for their links and use each person's last chosen language (`MAIL_LOCALE` otherwise).

People can also be invited in bulk from an .xlsx or .csv file on the People page, and open invitations can be sent again with a new link.

## Profiles and analytics

Each profile shows work details (manager, start date, employment, location, tags and the organization's own fields from Settings), completion of assigned rounds, when the person was last assessed and next due. Roles that see individual results also get, per test, the latest scores beside the team and organization averages and a small trend chart per scale; a change of 2 stens or 10 T-points or more is marked as beyond ordinary measurement error.

`/[org]/analytics` shows completion by round and team, a team-by-scale heatmap, score distributions and quarterly averages, filtered by test, team, position, round and dates. Filters live in the address, can be saved as named views and exported as CSV. Every figure is a group figure: groups under 5 people are hidden, and restricted instruments only appear for roles that may see them.

## Privacy

- **Audit log.** Opening a test result, questionnaire answers or a report, saving a report version, changing someone's role, team or follow-up flag, removing people, changing settings, transferring ownership, data downloads and consent withdrawals are recorded in `AuditEvent` (`src/utils/audit.ts`), without answers or scores. Owners read it at `/[org]/settings/audit` or from a person's profile (Access history). Events are kept for 24 months.
- **Retention.** Settings has two periods: results (answers, scores, drafts and report versions) and candidates (erased with all their data after their last hiring round closed). The hourly maintenance job applies them (`src/utils/retention.ts`).
- **Erasure.** Removing someone, leaving an organization and retention all use `eraseInOrganization` (`src/utils/erasure.ts`), which also deletes drafts, report versions, round assignments and saved views.
- **People's own rights.** The account page offers a JSON download of everything held about the person (`/account/export`) and consent withdrawal per organization. Without consent, respondents can't open or submit anything; this is checked in the submit and draft actions, not only in the interface.

## Instrument studio

People who manage the library (owner, admin, psychologist) can create tests and questionnaires in the browser, copy a shared library one to adapt it, and edit their organization's own. The editor (`src/components/studio`) covers details, questions and choices, scales with points per answer and formulas, sten norms or T-score tables, and interpretations. It saves a draft as you type (`draft` column), lists what still blocks publishing, and publishes the draft as a new numbered version with an optional note (`src/actions/studio/studio-actions.ts`). Nothing respondents see changes until then. New instruments are version 0 and stay out of the library until first published.

Every published version is kept in `InstrumentVersion` as a snapshot of its content and translations. Submissions record the version answered, and results, reports, metrics, analytics and data exports score and show them with that version (`src/utils/instrument-versions.ts`), so editing a test never changes results already given. The Versions page lists each version with its note, author and number of results, and can restore an earlier one into the draft. Translation overlays for questions and scales that were removed or reworded are dropped on publish, so the other language falls back to the new text rather than showing the old one.

The sensitive flag and retest interval are settings, applied straight away. The Mini-Mult K-correction is still tied to scale ids 3 (K) and 4, 7, 9, 10 and 11 in any T-score test (`src/utils/scoring.ts`); it only has an effect when a scale has a `correction` factor, which the studio doesn't set, so studio-made tests are unaffected and copies of the Mini-Mult keep working.

## Access rules

- Signed-out visitors can only see the landing page, the privacy notice, sign-in, sign-up, password reset and invitation pages.
- Members must accept their organization's privacy notice before taking anything; the date is stored on `Membership.consentedAt`.
- Every server action checks the session and role itself with `requireUser()` or `requireMember(permission)`, and pages use `ensureMember(permission)`, all from `src/utils/authentication.ts`. Queries are always scoped to the active organization, which comes from the slug in the address when there is one. Keep doing this in new actions: the proxy only checks that a cookie exists.
- Data sent to the browser uses `publicUserSelect` from `src/utils/user.ts`, which leaves out the password hash and recovery answer.

## Scoring

Test submissions are scored on the server when they are saved (`src/utils/scoring.ts`). Formulas in imported spreadsheets are evaluated with `fparser`, never `eval`.

Lie, sincerity and other validity scales carry a `validity` rule in `prisma/seed-data/tests.json` (`measure` is `grade`, `stan` or `tGrade`; `max` is the top of the normal range). Reports show them in a panel at the top of each test and warn when a score is above `max` (`src/utils/validity.ts`). Re-run `npm run db:seed` after changing a rule. Prognoz-2's sincerity scale has no cut-off yet, so its score is shown without a verdict.
