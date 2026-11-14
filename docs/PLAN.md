# Warband — v1 Work Plan

How the v1 rewrite gets built. What v1 is: [`PRODUCT.md`](./PRODUCT.md),
[`DOMAIN.md`](./DOMAIN.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md),
terms: [`GLOSSARY.md`](../GLOSSARY.md).

## Setup

- **Where:** this repo, long-lived `v1` branch. Fresh Next 15 scaffold; the
  first commit removes the previous version's code (history keeps it).
- **Who / when:** solo, no fixed deadline, 2-week sprints on the Jira SCRUM
  board. One epic, "Warband v1", one story per slice below.
- **Databases:** Neon `dev` branch for local work and Vercel previews; Neon
  main branch for production.
- **Branching:** one short-lived branch per slice → PR into `v1`. `v1` merges
  into `main` when all slices are done.

## Definition of done (every slice)

- Lint, typecheck and tests pass.
- Works on a Vercel preview deploy.
- Merged into `v1`.
- Docs updated if the slice changed a decision.

## Slices (in order)

Each slice is vertical: schema, logic and UI together.

Jira: epic [SCRUM-6](https://katyapula.atlassian.net/browse/SCRUM-6);
slices 0–10 are SCRUM-7 … SCRUM-17 in order. Doc review: SCRUM-5.

| #  | Slice                    | Includes                                                                                     | Depends on |
| -- | ------------------------ | -------------------------------------------------------------------------------------------- | ---------- |
| 0  | Foundation               | Scaffold Next 15 + TS + antd; remove old code; Prisma schema + first migration; NextAuth Google; role from `ADMIN_EMAILS`; session has `id`/`role`; admin route guard; config module; header with sign-in/out; Vercel + Neon wired up; test runner | — |
| 1  | Admin tables             | Create, edit, deactivate tables                                                              | 0          |
| 2  | Admin settings           | Club info, weekly opening hours (close ≤ midnight), closed dates; seed `ClubSettings`        | 0          |
| 3  | Booking rules            | Pure functions for all booking checks, derived statuses (Expired/Completed), time-zone helper; written test-first | 0 |
| 4  | Availability grid        | Home: club info + tables × time grid for a date; visitors see booked/free, members see names | 1, 2, 3    |
| 5  | Create booking           | Book form: whole day or time range, note; transactional overlap check; starts Pending        | 4          |
| 6  | My bookings & cancel     | Upcoming/past list with derived statuses, "changed by admin" note slot; cancel own booking   | 5          |
| 7  | Admin approval queue     | Pending list; approve/reject with reason; admin cancel with reason                           | 5          |
| 8  | Affected bookings        | On settings page: list blocking bookings outside new hours / on closed dates, with links to edit or cancel | 2, 7 |
| 9  | Admin edit               | Edit pending/approved not-yet-started bookings; re-validate (no window limit); keep status; set edit reason; shown in My bookings | 6, 7 |
| 10 | Walk-in bookings         | Admin creates booking with name + optional phone (admin-only); approved immediately; edit/cancel by admins only | 9 |

## Not in v1

See "Out of scope" in [`PRODUCT.md`](./PRODUCT.md). Notably deferred to v2:
admin booking on behalf of an existing member, notifications (Telegram).
