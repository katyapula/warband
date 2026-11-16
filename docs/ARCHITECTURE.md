# Warband — Architecture (Draft, v1 rewrite)

## Stack

| Concern        | Choice                                   | Notes                                              |
| -------------- | ---------------------------------------- | -------------------------------------------------- |
| Framework      | Next.js 15, **App Router only**          | Drop `pages/api`; use server components + server actions |
| Language       | TypeScript (strict)                      |                                                    |
| Database       | PostgreSQL on Neon                       | Fresh database, no migration from previous version |
| ORM            | Prisma                                   | Migrations via `prisma migrate`                    |
| Auth           | NextAuth (Auth.js), Google provider only | Users matched by email; role stored in DB, `ADMIN_EMAILS` forced to admin on sign-in |
| UI             | antd                                     | dayjs for dates (antd dependency)                  |
| Client state   | Server state via server components/actions; add zustand only if real client state appears | SWR likely unnecessary |
| Hosting        | Vercel                                   |                                                    |
| Tests          | Unit tests for booking rules             | No E2E in v1                                       |
| i18n           | None — English only                      |                                                    |

## Folder structure (Feature-Sliced inspired)

```
src/
  app/                 # Next.js routes only (thin)
    page.tsx           # Home: day view (?date=YYYY-MM-DD)
    about/
    signin/
    my-bookings/
    profile/
    admin/
      members/
      archive/
      tables/
      settings/
    api/auth/[...nextauth]/route.ts
  entities/            # Domain types + data access per entity
    booking/
    club-day/
    table/
    club-settings/
    user/
  features/            # User actions (UI + server action)
    manage-club-day/   # activate / deactivate / edit hours
    booking-form/      # create + edit modal (member and admin variants)
    cancel-booking/    # incl. admin "clear table"
    review-booking/    # approve / reject / admin comment
    booker-search/     # member + walk-in autocomplete
    edit-profile/
    manage-members/    # add by email, roles
    manage-tables/
    edit-club-settings/
  widgets/             # Composite UI (day strip, day view, header)
  shared/
    lib/               # prisma client, auth helpers, time utils
    config/            # env + app config (timezone, window, step)
    ui/
```

## Key design points

### Booking rules as pure functions

All validation from `DOMAIN.md` → "Business rules" lives in a pure module
(e.g. `entities/booking/rules.ts`) taking the `ClubDay`, existing bookings,
the actor and the request, returning a result or a list of errors. Derived statuses and flags (Expired,
Completed, On inactive day, Outside working hours) live next to it. This is
the primary unit-test target. Server actions call it, then persist inside a
transaction.

### Preventing double booking

Overlap check + insert run in a single transaction. Consider a Postgres
exclusion constraint on `(tableId, tstzrange(startsAt, endsAt))` for
`status IN ('PENDING','APPROVED')` as a hard guarantee (requires a raw SQL
migration with `btree_gist`).

### Time handling

- Store `startsAt`/`endsAt` in UTC.
- Interpret club days, working hours and the booking window in
  `CLUB_TIMEZONE` (`Europe/Kyiv`). Use the IANA name, not a fixed `+02:00`
  offset, because Ukraine switches to UTC+3 in summer.
- Keep timezone conversion in one helper in `shared/lib/time`.
- A whole-day booking is local 00:00 → next local 00:00, converted to UTC
  (23 or 25 hours on DST change days — that's fine).

### Authorization

- Every server action checks the session; admin actions check `role === ADMIN`.
- Admin routes are protected in middleware and again in the action (defense in depth).
- Session exposes `user.id` and `user.role` (NextAuth callbacks). Role is
  read from the DB so promotions take effect without code changes.
- Sign-in callback: find user by email → claim pre-created account or
  create one; apply `ADMIN_EMAILS`.
- Members may only edit/cancel bookings where `userId = session.user.id`.

### Data visibility

- Day query for visitors returns only table + time ranges.
- Signed-in members also get usernames; status and admin comment only on
  their own bookings.
- Walk-in contact, profiles (except username) and admin notes are only
  returned to admins (and profiles to their owner). Shape this in the
  query layer, not the UI.

## Environment variables

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=
CLUB_TIMEZONE=Europe/Kyiv
BOOKING_WINDOW_DAYS=30
SLOT_STEP_MINUTES=30
MIN_BOOKING_MINUTES=60
```

No secrets in source code. The previous version committed a Google API key in
`src/app/constants.ts`; that key must be rotated and the file removed.

## To remove from the previous version

- `pages/api/*` (clubs, tables, prisma) → server actions / server components
- `Club` model, club tabs (`TabsComponent`)
- `/dashboard`, `/users` (mockapi), `/signup`, `CreateUser.ts`, `useCreateUser`
- `src/app/constants.ts` (Google Sheets key, mockapi URL)
- `src/app/actions.ts` raw Neon query stub
- Leftover `console.log`s
