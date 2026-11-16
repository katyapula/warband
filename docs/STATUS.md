# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git.

_Last updated: 2026-11-16_

## Now

- **Current slice:** 6 + 7 in review, one PR from `slice-6-member-booking`.
- **Branch:** `slice-6-member-booking` (from `v1`).
- **State:** members book from the day view (Add on tables with a free gap,
  modal offers only free times, Whole day, note; starts Pending), cancel
  their own bookings, see Pending/Approved and admin comments on them, and
  get a ring mark in the strip on days they booked. `/my-bookings` lists
  Upcoming and Past with derived statuses, ⚠ On inactive day, Cancel.
  Migration `20261116200000_booking_columns` is applied to Neon `dev`.
- **Next step:** check the PR's Vercel preview as a member, merge, then
  slice 8 (admin review). Still unchecked on the `v1` preview:
  `/admin/settings` (slice 2) and the slice 5 admin day controls.

## Slices

Full scope per slice: [`PLAN.md`](./PLAN.md).

| #  | Slice                       | State       |
| -- | --------------------------- | ----------- |
| 0  | Foundation                  | Done        |
| 1  | Admin tables                | Done        |
| 2  | Admin settings & about      | Done        |
| 3  | Booking rules               | Done        |
| 4  | Profiles & members          | Done        |
| 5  | Day view & club days        | Done        |
| 6  | Member booking              | In review   |
| 7  | My bookings                 | In review   |
| 8  | Admin review                | To do       |
| 9  | Admin booking & edit        | To do       |
| 10 | Conflicts                   | To do       |

## Loose ends

- **Blocking in queries:** `blockingWhere(now)` in
  `entities/booking/repository.ts` is the Prisma twin of `isBlocking`;
  every query for blocking bookings uses it.
- **Admin Add is slice 9:** in slices 6–7 only members see Add on the day
  view; `createOwnBooking` already makes an admin's own booking Approved.
- **Admin Cancel is slice 8:** the day view shows Cancel only on a
  member's own bookings; `cancelBookingAction` already allows admins.
- **⚠ On inactive day:** slice 7 shows it in My bookings; the day view
  doesn't yet show members their bookings on inactive days (slice 10).
- **Slice 5 left for later slices:** inactive days with bookings shown to
  admins and members' own bookings on inactive days (slice 10); the
  Edit-hours confirmation listing bookings outside new hours (slice 10).
- **Docs trimmed 2026-11-16:** member edit, Clear, archive page, accounts
  created in advance, whole-day storage, the hours flag, `Booking.date` and
  `createdById` moved to v2 or dropped. Slice 11 (Archive) is gone.
- **Old Google API key:** the previous version committed one in
  `src/app/constants.ts`. Confirm it was rotated in Google Cloud.
- **Restart `npm run dev` after every migration.** `shared/lib/prisma.ts`
  keeps one client on `globalThis`, so a running server keeps the old
  schema and signed-in pages fail until restarted.

## Requests

Bugs and wishes from the club admin, copied in from chat. Triage each into a
slice, a "Next version ideas" entry in `PRODUCT.md`, or drop it.

_None yet._

## Working a slice

1. Read this file, then the slice's row in `PLAN.md`.
   Read `PRODUCT.md` / `DOMAIN.md` sections only as the slice needs them.
2. Branch `slice-<N>-<slug>` from `v1`; mark the slice In progress below.
3. Build schema → logic (test-first for rules) → UI.
4. Done when `npm run check` passes, it works on the Vercel preview, and
   the PR (`Slice <N>: <summary>`) is merged into `v1`.
5. Update docs if a decision changed; update **Now**, **Slices** and
   **Loose ends** here.
