# Warband — Status

The hand-off note between sessions. Read it at the start of a session; update
it at the end of one (or whenever a slice changes state). Keep it short:
what's true *now* and what to do next. History lives in git and Jira.

_Last updated: 2026-11-16_

## Now

- **Current slice:** 2 — Admin settings & about
  ([SCRUM-9](https://katyapula.atlassian.net/browse/SCRUM-9), In Progress)
- **Branch:** `scrum-9-admin-settings` (from `v1`)
- **State:** in-progress code builds the *old* model (weekly opening hours,
  closed dates). Specs were re-cut on 2026-11-16 — rework to the new model
  before continuing (see Loose ends).
- **Next step:** commit the doc updates (re-cut specs, ADR 0002, this file),
  then rework slice 2 per SCRUM-9.

## Slices

Full scope per slice: [`PLAN.md`](./PLAN.md) and its Jira story.

| #  | Slice                       | Jira      | State       |
| -- | --------------------------- | --------- | ----------- |
| 0  | Foundation                  | SCRUM-7   | Done        |
| 1  | Admin tables                | SCRUM-8   | Done        |
| 2  | Admin settings & about      | SCRUM-9   | In progress |
| 3  | Booking rules               | SCRUM-10  | To do       |
| 4  | Profiles & members          | SCRUM-11  | To do       |
| 5  | Day view & club days        | SCRUM-12  | To do       |
| 6  | Member booking              | SCRUM-13  | To do       |
| 7  | My bookings & member edit   | SCRUM-14  | To do       |
| 8  | Admin review                | SCRUM-15  | To do       |
| 9  | Admin booking & edit        | SCRUM-16  | To do       |
| 10 | Conflicts                   | SCRUM-17  | To do       |
| 11 | Archive                     | SCRUM-18  | To do       |

## Loose ends

- **Init migration is already applied** (merged in slice 0 with
  `OpeningHours`/`ClosedDate`). Remove them with a *new* migration in
  slice 2; never edit `20261114000000_init`.
- **Slice 2 code to remove:** `src/features/manage-club-settings/OpeningHoursForm.tsx`,
  `ClosedDatesManager.tsx`, and their parts in `src/entities/club/`.
- **Auth from slice 0** still assigns roles from `ADMIN_EMAILS` only;
  match-by-email, pre-created accounts and DB roles land in slice 4.
- **SCRUM-5** (doc review) still lists opening hours / closed dates under
  "Things to check".

## Working a slice

1. Read this file, then the slice's row in `PLAN.md` and its Jira story.
   Read `PRODUCT.md` / `DOMAIN.md` sections only as the slice needs them.
2. Branch `scrum-<N>-<slug>` from `v1`; move the Jira story to In Progress.
3. Build schema → logic (test-first for rules) → UI.
4. Done when `npm run check` passes, it works on the Vercel preview, and
   the PR (`SCRUM-<N>: <summary>`) is merged into `v1`.
5. Update docs if a decision changed; update **Now**, **Slices** and
   **Loose ends** here; move the Jira story to Done.
