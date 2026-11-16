# Warband — v1 Work Plan

How the v1 rewrite gets built. What v1 is: [`PRODUCT.md`](./PRODUCT.md),
[`DOMAIN.md`](./DOMAIN.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md),
terms: [`GLOSSARY.md`](../GLOSSARY.md).

## Setup

- **Where:** this repo, long-lived `v1` branch. Fresh Next 15 scaffold; the
  first commit removes the previous version's code (history keeps it).
- **Who / when:** solo, no fixed deadline. Progress is tracked in
  [`STATUS.md`](./STATUS.md); no external tracker.
- **Databases:** Neon `dev` branch for local work and Vercel previews; Neon
  main branch for production.
- **Branching:** one short-lived branch per slice (`slice-<N>-<slug>`) →
  PR titled `Slice <N>: <summary>` into `v1`. `v1` merges
  into `main` when all slices are done (released 2026-11-16, #13).

## Definition of done (every slice)

- Lint, typecheck and tests pass.
- Works on a Vercel preview deploy.
- Merged into `v1`.
- Docs updated if the slice changed a decision.

## Slices (in order)

Each slice is vertical: schema, logic and UI together.

The slices below were re-cut on 2026-11-16 (day view, member profiles) and
trimmed the same day (member edit, Clear, archive, accounts created in
advance moved to v2); slices 0–1 were done before the re-cut. Slices 0–2 used `scrum-<N>-…`
branch names from an earlier Jira board.

| #  | Slice                    | Includes                                                                                     | Depends on |
| -- | ------------------------ | -------------------------------------------------------------------------------------------- | ---------- |
| 0  | Foundation               | Scaffold Next 15 + TS + antd; remove old code; Prisma schema + first migration; NextAuth Google; role from `ADMIN_EMAILS`; session has `id`/`role`; admin route guard; config module; header with sign-in/out; Vercel + Neon wired up; test runner | — |
| 1  | Admin tables             | Create, edit, deactivate tables                                                              | 0          |
| 2  | Admin settings & about   | Migration (see `DOMAIN.md` → "Migrations from the init schema"): drop weekly hours/closed dates, add default hours to `ClubSettings`, add `ClubDay`; club info + default working hours form; `/about` page | 0          |
| 3  | Booking rules            | Pure functions for all booking checks (incl. edit re-validation only when table/date/time change), derived statuses and the On inactive day flag, Needs attention predicate, time-zone helpers (local date of a booking, UTC range of a local date); written test-first | 0 |
| 4  | Profiles & members       | Migration: `name` → unique `username`, profile fields, `Role.USER` → `MEMBER`; sign-in matches by email or creates the user, role read from DB (`ADMIN_EMAILS` forced to admin); `/profile`; `/admin/members`: list/search, edit profiles + admin notes, change roles with `ADMIN_EMAILS`/self guards | 0 |
| 5  | Day view & club days     | Home day strip (week, ‹ ›, window, default landing day, `?date=`, admins can go into past days read-only); active-day dots; per-role table list (visitor: Booked; member: usernames, walk-ins as Booked); admin Activate / Edit hours / Deactivate; "chilling" message | 1, 2, 3    |
| 6  | Member booking           | Migration: booking columns (`walkInContact`, `adminComment`, drop old columns); Add modal (start/end or Whole day, note) on tables with a free gap; locked transaction for the overlap check; starts Pending; own-booking tags and day marks; Cancel with confirmation | 5          |
| 7  | My bookings              | Upcoming/past list with derived statuses, flag and admin comment; Cancel from the list        | 6          |
| 8  | Admin review             | Booking rows in admin day view: Approve, Cancel (also declines), admin comment (also on past days); pending badges in strip; Needs attention (N) nav | 6          |
| 9  | Admin booking & edit     | Admin Add/Edit modal: booker autocomplete over members, walk-in name/contact; approved immediately; admin edit keeps status | 4, 8       |
| 10 | Conflicts                | ⚠ On inactive day on day view and My bookings; inactive days with bookings shown to admins and counted in Needs attention; ⚠ in strip; Edit hours confirmation listing bookings outside the new hours | 7, 8 |

## Not in v1

See "Out of scope" and "Next version ideas" in [`PRODUCT.md`](./PRODUCT.md).
