# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git.

_Last updated: 2026-11-16_

## Now

- **Current slice:** 10 (conflicts) in review, PR from `slice-10-conflicts`.
  It is the last v1 slice.
- **Branch:** `slice-10-conflicts` (from `v1`).
- **State:** slices 0–9 merged; Reject was merged into Cancel (one
  Cancelled status). Slice 10 shows inactive days that still have
  bookings to admins (with ⚠ in the strip) and members' own bookings on
  them, tags those bookings ⚠ On inactive day, and confirms Edit hours
  with the bookings the new hours leave outside.
- **Next step:** check the PR's Vercel preview, merge, then release v1
  (`PLAN.md` → Setup): optionally squash the migrations into one init
  migration and reset Neon `dev`, then merge `v1` into `main`. Still
  unchecked on the `v1` preview: `/admin/settings` (slice 2) and the slice
  5 admin day controls.

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
| 6  | Member booking              | Done        |
| 7  | My bookings                 | Done        |
| 8  | Admin review                | Done        |
| 9  | Admin booking & edit        | Done        |
| 10 | Conflicts                   | In review   |

## Loose ends

- **Blocking in queries:** `blockingWhere(now)` in
  `entities/booking/repository.ts` is the Prisma twin of `isBlocking`;
  every query for blocking bookings uses it.
- **Every booking write** goes through `lockAndCheck` in
  `entities/booking/repository.ts` (locks the table row, loads the day
  and blocking bookings). New writes that move a booking must use it.
- **Admin booker list** is loaded whole into the admin day view
  (`listBookerOptions`); fine for one club, switch to a search action if
  members grow into the thousands.
- **⚠ On inactive day:** slice 7 shows it in My bookings; the day view
  doesn't yet show members their bookings on inactive days (slice 10).
- **Bookings on inactive tables** don't show on the day view (active or
  inactive day); they still count in Needs attention. Decide in v2 whether
  deactivating a table should warn like deactivating a day.
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
