# Warband — Architecture (v1)

## Stack

| Concern        | Choice                                   | Notes                                              |
| -------------- | ---------------------------------------- | -------------------------------------------------- |
| Framework      | Next.js 15, **App Router only**          | Server components + server actions; no `pages/api` |
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
      tables/
      settings/
    api/auth/[...nextauth]/route.ts
  entities/            # Domain types + data access per entity
    booking/
    club/              # club settings + club days
    table/
    user/
  features/            # User actions (UI + server action)
    manage-club-days/  # activate / deactivate / edit hours
    booking-form/      # create (member + admin) and admin edit modal
    cancel-booking/
    review-booking/    # approve / reject / admin comment
    booker-search/     # member autocomplete
    edit-profile/
    manage-members/    # list, edit profiles, roles
    manage-tables/
    manage-club-settings/
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
the actor and the request, returning a result or a list of errors. Derived
statuses and the flag (Expired, Completed, On inactive day) live next to it.
This is the primary unit-test target. Server actions call it, then persist
inside a transaction.

### Preventing double booking

Create and edit run in one transaction: lock the table's row
(`SELECT … FROM "Table" WHERE id = $1 FOR UPDATE` via `$queryRaw`), load
its blocking bookings for the day, run the rules, write. Bookings for the
same table are serialized; different tables don't wait on each other. No
exclusion constraint (see `DOMAIN.md` → "Preventing double booking").

### Time handling

- Store `startsAt`/`endsAt` in UTC.
- Interpret club days, working hours and the booking window in
  `CLUB_TIMEZONE` (`Europe/Kyiv`). Use the IANA name, not a fixed `+02:00`
  offset, because Ukraine switches to UTC+3 in summer.
- Keep timezone conversion in one helper in `shared/lib/time`, including
  "club-local date of a booking" and "UTC range of a club-local date"
  (used by day queries: `startsAt` in `[local 00:00, next local 00:00)`).

### Authorization

- The session cookie carries only the member's id. `getMember()`
  (`shared/lib/auth/session.ts`) reads username and role from the DB once per
  request, so profile edits and promotions apply without signing in again.
- Middleware only checks that `/admin/*` and `/profile` have a signed-in
  member. Admin pages call `requireAdminPage()` (redirects) and server actions
  call `requireAdmin()` (returns an error), both checking the DB role.
- Sign-in callback: find user by email or create one (username from the
  Google name, made unique ignoring case); apply `ADMIN_EMAILS`.
- Members may only cancel bookings where `userId = session.user.id`.

### Data visibility

- Day query for visitors returns only table + time ranges.
- Signed-in members also get usernames of member bookings; walk-in
  bookings come back as time ranges only. Status and admin comment only on
  their own bookings.
- Walk-in name and contact, profiles (except username) and admin notes are
  only returned to admins (and profiles to their owner). Shape this in the
  query layer, not the UI.

## Environment variables

```
DATABASE_URL=
DATABASE_URL_UNPOOLED=
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

No secrets in source code.
