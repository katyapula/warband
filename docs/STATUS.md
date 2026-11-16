# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git.

_Last updated: 2026-11-16_

## Now

- **Current slice:** 2 — Admin settings & about (in progress)
- **Branch:** `scrum-9-admin-settings` (from `v1`)
- **State:** reworked to the club-day model: migration
  `20261116000000_club_days` (applied on Neon `dev`), club info + default
  working hours form, `/about`, About link in the header. `npm run check`
  passes. Not yet committed; `/admin/settings` not yet tried signed in.
- **Next step:** try `/admin/settings` as an admin on a Vercel preview,
  then open the PR `Slice 2: Admin settings & about` into `v1`.

## Slices

Full scope per slice: [`PLAN.md`](./PLAN.md).

| #  | Slice                       | State       |
| -- | --------------------------- | ----------- |
| 0  | Foundation                  | Done        |
| 1  | Admin tables                | Done        |
| 2  | Admin settings & about      | In progress |
| 3  | Booking rules               | To do       |
| 4  | Profiles & members          | To do       |
| 5  | Day view & club days        | To do       |
| 6  | Member booking              | To do       |
| 7  | My bookings                 | To do       |
| 8  | Admin review                | To do       |
| 9  | Admin booking & edit        | To do       |
| 10 | Conflicts                   | To do       |

## Loose ends

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
