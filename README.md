# Prisma

Web app for HR teams to run psychological questionnaires and test instruments, score them, and review results. The interface is available in English and Russian.

## Getting started

```bash
npm ci
cp .env.example .env          # then set ADMIN_EMAIL and ADMIN_PASSWORD
npx prisma migrate deploy     # creates the SQLite database
npm run db:seed               # loads the bundled tests and forms, creates the owner and organization
npm run dev
```

Open http://localhost:3000 and sign in with the owner email and password. Anyone can also sign up, which creates a new organization they own.

### Existing databases

Databases created before migrations were added already have every table. Mark the initial migration as applied instead of running it:

```bash
npx prisma migrate resolve --applied 0_init
npx prisma migrate deploy
```

`1_hr_profile` then converts the old profile to the HR one and keeps the data: patronymic becomes middle name, division becomes department, rank becomes position, and Russian group names become group keys. Rank-only, service and address fields are dropped, so back up the database first. Forms and categories already in the database stay as they are; the seed only adds or updates the bundled ones.

`4_organizations` moves everyone into one organization called "My organization" (rename it in Settings). Former admins become psychologists and the earliest of them becomes the owner; everyone else becomes a member. Departments become teams, groups other than `general` become follow-up flags, and all submissions and conclusions belong to that organization. Accounts keep signing in with their phone number and can add an email later.

`5_unique_organization_names` makes organization names unique, compared without case or extra spaces. If two organizations already share a name, the older one keeps it and the others get " (2)", " (3)" and so on; rename them in Settings afterwards. An organization whose address is still the placeholder `/default` gets a real one the first time it is renamed.

## Deploying to Railway

The repository deploys to [Railway](https://railway.com) as is: `railway.json` builds the `Dockerfile` and checks `/api/health` before switching traffic. Each start applies migrations and re-runs the seed, which is safe to repeat.

1. Create a project from this GitHub repository.
2. Add a volume to the service, mounted at `/data`. SQLite lives there, so data survives deploys. Keep the service at one replica while the database is SQLite.
3. Set these variables on the service:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `file:/data/prisma.db` |
| `APP_URL` | The public address, e.g. `https://prisma.up.railway.app` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first owner, created on the first start |
| `ORGANIZATION_NAME` | That owner's organization |
| `RESEND_API_KEY`, `MAIL_FROM` | Email for invitations and password resets (optional) |

4. Generate a domain under Settings > Networking. Railway serves it over HTTPS, which the session cookie needs in production.

To move an existing database in, upload the file to the volume (for example with `railway ssh`) before the first start, and back it up first.

The same image runs on any Docker host: `docker build -t prisma .` then `docker run -p 3000:3000 -v prisma-data:/data -e DATABASE_URL=file:/data/prisma.db ... prisma`.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npx tsc --noEmit` | Type check |
| `npm test` | Scoring unit tests (Vitest, snapshots of every bundled instrument) |
| `npm run db:seed` | Re-run the seed (safe to repeat) |

## Languages

Interface text lives in `messages/en.json` and `messages/ru.json` (next-intl, no locale in the URL). The locale comes from the `NEXT_LOCALE` cookie set by the language switcher, then the browser's `Accept-Language`, then English. Keep both files with the same keys.

Bundled tests, questionnaires and categories are written in Russian and carry an English overlay in `prisma/seed-data/translations/en/<kind>/<id>.json`, loaded by the seed into each row's `translations` column. The overlay replaces names, instructions, questions, answer options, scale names and result summaries by id, so scoring is unaffected and missing entries fall back to Russian (see `src/utils/content-translation.ts`). The English wording is a working translation, not a validated or licensed edition of each instrument. "Pattern Finding" keeps its Russian words because the task depends on their spelling. Spreadsheet import templates keep their Russian column headers.

Tests and forms retired in the move away from military use are kept in `prisma/seed-data/retired/`. The seed does not load them.

## Design

Colours are CSS variables in `src/app/globals.css` (light and dark), fonts are Inter for text and Manrope for headings (`src/app/layout.tsx`), and the logo is `src/components/ui/logo.tsx`. Staff pages live under `src/app/[org]/` inside an inset sidebar (`src/components/ui/sidebar.tsx`, groups in `src/app/[org]/components/navigation.ts`) with breadcrumbs and a Ctrl+K search. They start with `PageHeader`, which also names the last breadcrumb, and share `loading.tsx`, `error.tsx`, `not-found.tsx` and `EmptyState`; respondent screens are built for phones first, with one question per screen and a Back button (`src/components/runner/`).

## Organizations and roles

Each organization has its own people, teams, results and uploaded instruments; one account can belong to several and switch between them in the sidebar. Staff pages carry the organization's slug in the address (`/acme-ltd/people`), so a shared link always opens the right organization; the middleware passes the slug to the server in the `x-organization` header and also remembers it in the `active_org` cookie for pages outside the slug, such as `/forms` and `/tests` for respondents. Old `/dashboard/...` links redirect to the matching page. Opening another organization's slug shows "not found". Bundled instruments (`organizationId` null) are shared by every organization.

Organization names are unique regardless of case and spacing (`Organization.nameKey`). Owners can transfer ownership (they become an admin) and delete the organization after typing its name, under Settings. Everyone can change their name, email and password and leave an organization on the account page (`/account`); the last owner has to transfer ownership first.

| Role | Can |
| --- | --- |
| Owner | Everything, including settings and assigning owners |
| Admin | Manage people, teams, invitations, settings and the instrument library |
| Psychologist | Manage the library, see restricted instruments and follow-up flags, write conclusions |
| HR manager | See the dashboard and non-restricted results |
| Member | Take assigned questionnaires and tests |

Permissions are defined in `src/utils/roles.ts`. People join through invitation links (valid 7 days, only a hash of the token is stored). Links are emailed when `RESEND_API_KEY` is set and can always be copied from the People page. Password reset works the same way.

Follow-up flags (`monitoring`, `risk`, `suicide-risk`, `substance-risk`, in `src/utils/flags.ts`) are only visible to owners and psychologists.

Clinical instruments are marked `sensitive` in `prisma/seed-data/tests.json`: members don't see them and HR managers and admins don't see their results. Only Communication and Organizational Tendencies, Analogies, Mental Arithmetic, Leadership Tendency, Pattern Finding and Risk Readiness (Schubert) are unrestricted. Change the flag in that file and re-run the seed to adjust. Check licensing before using HADS, BDI or the Mini-Mult commercially.

## Access rules

- Signed-out visitors can only see the landing page, the privacy notice, sign-in, sign-up, password reset and invitation pages.
- Members must accept their organization's privacy notice before taking anything; the date is stored on `Membership.consentedAt`.
- Every server action checks the session and role itself with `requireUser()` or `requireMember(permission)`, and pages use `ensureMember(permission)`, all from `src/utils/authentication.ts`. Queries are always scoped to the active organization, which comes from the slug in the address when there is one. Keep doing this in new actions: the middleware only checks that a cookie exists.
- Data sent to the browser uses `publicUserSelect` from `src/utils/user.ts`, which leaves out the password hash and recovery answer.

## Scoring

Test submissions are scored on the server when they are saved (`src/utils/scoring.ts`). Formulas in imported spreadsheets are evaluated with `fparser`, never `eval`.

Lie, sincerity and other validity scales carry a `validity` rule in `prisma/seed-data/tests.json` (`measure` is `grade`, `stan` or `tGrade`; `max` is the top of the normal range). Reports show them in a panel at the top of each test and warn when a score is above `max` (`src/utils/validity.ts`). Re-run `npm run db:seed` after changing a rule. Prognoz-2's sincerity scale has no cut-off yet, so its score is shown without a verdict.
