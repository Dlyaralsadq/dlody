# ClinicPro (كلينيك برو)

Next.js 16 (App Router) SaaS for medical clinic management. TypeScript, Tailwind CSS v4,
Prisma ORM v7, `next-intl` (Arabic RTL + English). Single web service; no separate backend.

## Cursor Cloud specific instructions

The startup update script already runs `npm install` and `npx prisma generate`. The
following notes cover what that script intentionally does NOT do.

### Database (required before running/seeding)

- Local dev uses SQLite at `dev.db` (gitignored, so it does NOT exist on a fresh VM).
  `src/lib/prisma.ts` auto-selects the better-sqlite3 adapter unless `DATABASE_URL` is a
  `postgres(ql)://` URL (Postgres + `@prisma/adapter-pg` is only used in production).
- No `.env` is needed for dev; `DATABASE_URL` defaults to `file:./dev.db`.
- On a fresh VM you must create + seed the DB before the app is useful:
  - `npx prisma migrate deploy` (apply migrations)
  - `npx tsx prisma/seed.ts` (seed demo data)
  - or `npm run db:reset` to wipe and re-seed in one step.
- Migrations/seed are deliberately kept out of the update script (they mutate data and the
  DB file is environment-local).

### Running / lint / build

- Dev server: `npm run dev` (Next.js + Turbopack on port 3000). Root `/` redirects to `/ar`.
- Build / prod: `npm run build` then `npm run start`. `start.sh` + `ecosystem.config.js`
  (pm2) + cloudflared are deployment-only helpers — not needed for local dev.
- Lint: `npm run lint`. NOTE: the repo currently has many pre-existing lint errors
  (e.g. `no-explicit-any`, `no-require-imports` in `src/lib/prisma.ts`); a non-zero exit is
  expected and is not caused by environment setup.
- There is no automated test suite.

### Auth / demo logins (after seeding)

- Custom cookie-based session (`src/lib/auth.ts`), not NextAuth despite the dependency.
- `admin` / `admin123` (admin), `dr.ahmad` / `admin123` (doctor).
- `secretary1` / `admin123` only exists if seeded via `start.sh`, not the base `seed.ts`.
