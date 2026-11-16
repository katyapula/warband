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

Jira: epic [SCRUM-6](https://katyapula.atlassian.net/browse/SCRUM-6). Doc
review: SCRUM-5. The slices below were re-cut on 2026-11-16 (day view,
member profiles); Slices 0–1 were done before the re-cut; slices 0–10
are SCRUM-7 … SCRUM-17 in order, slice 11 is SCRUM-18.

| #  | Slice                    | Includes                                                                                     | Depends on |
| -- | ------------------------ | -------------------------------------------------------------------------------------------- | ---------- |
| 0  | Foundation               | Scaffold Next 15 + TS + antd; remove old code; Prisma schema + first migration; NextAuth Google; role from `ADMIN_EMAILS`; session has `id`/`role`; admin route guard; config module; header with sign-in/out; Vercel + Neon wired up; test runner | — |
| 1  | Admin tables             | Create, edit, deactivate tables                                                              | 0          |
| 2  | Admin settings & about   | Migration: drop weekly hours/closed dates, add default hours to `ClubSettings` and `ClubDay`; club info + default working hours form; `/about` page | 0          |
| 3  | Booking rules            | Pure functions for all booking checks, derived statuses and flags (Expired, Completed, On inactive day, Outside working hours), whole-day range, time-zone helper; written test-first | 0 |
| 4  | Profiles & members       | Migration: profile fields on `User`; sign-in matches by email and claims pre-created accounts, role read from DB (`ADMIN_EMAILS` forced to admin); `/profile` (username unique, profile fields); `/admin/members`: list/search, add by email, edit profiles + admin notes, change roles with `ADMIN_EMAILS`/self guards | 0 |
| 5  | Day view & club days     | Home day strip (week, ‹ ›, window, default landing day, `?date=`); per-role table list (visitor: Booked; member: usernames); admin Activate / Edit hours / Deactivate; "chilling" message | 1, 2, 3    |
| 6  | Member booking           | Migration: `Booking.date`, `adminComment`, `walkInContact`, `createdById`; Add modal (whole day / time range, note) on tables with a free gap; transactional overlap check; starts Pending; own-booking tags; Cancel with confirmation | 5          |
| 7  | My bookings & member edit| Upcoming/past list with derived statuses, flags and admin comment; member Edit (prefilled modal → back to Pending) from day view and My bookings | 6          |
| 8  | Admin review             | Booking rows in admin day view: Approve/Reject, Cancel, admin comment; table Clear with confirmation; pending badges in strip; Needs attention (N) nav | 6          |
| 9  | Admin booking & edit     | Admin Add/Edit modal: booker autocomplete (members + past walk-ins), walk-in name/contact, "Save this as a member" (email); approved immediately; admin edit keeps status | 4, 8       |
| 10 | Conflicts                | ⚠ flags on day view and My bookings; inactive days with bookings shown to admins and counted in Needs attention; ⚠ in strip | 7, 8 |
| 11 | Archive                  | `/admin/archive`: compact paginated past bookings, filters (date range, table, status)        | 8          |

## Not in v1

See "Out of scope" and "Next version ideas" in [`PRODUCT.md`](./PRODUCT.md).
