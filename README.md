# Призма

Web app for running psychological questionnaires and test instruments, scoring them, and reviewing results.

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
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npx tsc --noEmit` | Type check |
| `npm run db:seed` | Re-run the seed (safe to repeat) |

## Access rules

- Signed-out visitors can only see the landing page and the sign-in and sign-up pages.
- `/forms` and `/tests` need a signed-in user; `/dashboard` needs an admin.
- Every server action checks the session itself with `requireUser()` or `requireAdmin()` from `src/utils/authentication.ts`. Keep doing this in new actions: the middleware only checks that a cookie exists.
- Data sent to the browser uses `publicUserSelect` from `src/utils/user.ts`, which leaves out the password hash and recovery answer.

## Scoring

Test submissions are scored on the server when they are saved (`src/utils/scoring.ts`). Formulas in imported spreadsheets are evaluated with `fparser`, never `eval`.
