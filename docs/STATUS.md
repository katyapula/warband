# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git.

_Last updated: 2026-11-16_

## Now

- **Released:** v1 is on `main` and live at https://warband.vercel.app
  (2026-11-16, #13). All slices 0–10 are done.
- **Production database:** the old app's schema was backed up
  (`~/Documents/warband-prod-backup-2026-11-16.json`: 2 clubs, 15 tables,
  0 users, 0 bookings), dropped, and replaced by the v1 migrations. Warband's
  name, location and 9 tables were carried over; the Legacy club was not.
  Production `ADMIN_EMAILS` is set.
- **Branches:** `main` = production. New work branches from `main`;
  `v1` is finished.
- **Next step:** admins sign in on production, check club settings and
  tables, and activate the first days. Then triage Requests and the "Next
  version ideas" in `PRODUCT.md`.
- **Design refresh:** merged to `main` (#15): new helmet mark, app icon,
  all 8 steps in [`DESIGN.md`](./DESIGN.md), plus a designed `/admin`
  home and a visible Sign out on the dark bar. Next: check it on
  production in light and dark mode.
- **Releasing a schema change:** Vercel doesn't run migrations. Run
  `prisma migrate deploy` against the production database before (or
  right as) the code that needs it reaches `main`.

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
| 10 | Conflicts                   | Done        |

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
- **Old Neon `dev` data** still has v1 test bookings; reset it whenever
  convenient.
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
