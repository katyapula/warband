# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git.

_Last updated: 2026-11-16_

## Now

- **Current slice:** none in progress; slice 3 merged into `v1` (#7).
- **Branch:** next slice branches from `v1`.
- **State:** slices 0–3 done. Booking rules live in `src/entities/booking/`
  and club-time helpers in `src/shared/lib/time.ts`.
- **Next step:** check `/admin/settings` as an admin on the `v1` preview
  (left from slice 2), then start slice 4 (profiles & members) or slice 5
  (day view & club days); both are unblocked.

## Slices

Full scope per slice: [`PLAN.md`](./PLAN.md).

| #  | Slice                       | State       |
| -- | --------------------------- | ----------- |
| 0  | Foundation                  | Done        |
| 1  | Admin tables                | Done        |
| 2  | Admin settings & about      | Done        |
| 3  | Booking rules               | Done        |
| 4  | Profiles & members          | To do       |
| 5  | Day view & club days        | To do       |
| 6  | Member booking              | To do       |
| 7  | My bookings                 | To do       |
| 8  | Admin review                | To do       |
| 9  | Admin booking & edit        | To do       |
| 10 | Conflicts                   | To do       |

## Loose ends

- **Blocking in queries (slice 6):** `isBlocking` is an in-memory
  predicate. Slice 6 needs the same rule as a Prisma `where`
  (`APPROVED`, or `PENDING` with `startsAt > now`); keep it next to
  `status.ts` (ADR 0001: one helper, not scattered clauses).
- **`validateWorkingHours`** in `entities/club/model.ts` is meant to be
  reused by slice 5 (activate / edit hours of a day).
- **Docs trimmed 2026-11-16:** member edit, Clear, archive page, accounts
  created in advance, whole-day storage, the hours flag, `Booking.date` and
  `createdById` moved to v2 or dropped. Slice 11 (Archive) is gone.
- **Old Google API key:** the previous version committed one in
  `src/app/constants.ts`. Confirm it was rotated in Google Cloud.
- **Auth from slice 0** still assigns roles from `ADMIN_EMAILS` only;
  match-by-email, pre-created accounts and DB roles land in slice 4.

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
