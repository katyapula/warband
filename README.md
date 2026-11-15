# Warband

Table booking for a single wargaming club. Members sign in with Google and book
tables; admins approve bookings and run the club's schedule.

- What v1 is: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Domain model and rules: [`docs/DOMAIN.md`](docs/DOMAIN.md), terms in [`GLOSSARY.md`](GLOSSARY.md)
- Stack and structure: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Work plan: [`docs/PLAN.md`](docs/PLAN.md)

## Setup

```bash
cp .env.example .env.local   # fill in values; DATABASE_URL must point at the Neon dev branch
npm install                  # also generates the Prisma client
npm run db:migrate           # apply migrations (reads .env.local)
npm run dev
```

Keep all local values in `.env.local`. Next.js lets `.env.development.local` override
it, and the Prisma CLI on its own reads only `.env`, so stray copies of those files
(e.g. from `vercel env pull`) can silently point you at another database.

## Scripts

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Dev server on http://localhost:3000   |
| `npm run check`      | Lint + typecheck + unit tests         |
| `npm run test`       | Unit tests (Vitest)                   |
| `npm run build`      | Production build                      |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
