# Warband — Domain Model (v1)

Domain terms are defined in [`GLOSSARY.md`](../GLOSSARY.md).

## Entities (target Prisma schema)

```prisma
model ClubSettings {
  id               Int      @id @default(1) // singleton
  name             String
  location         String
  description      String
  defaultOpenTime  String   @default("12:00") // "HH:mm", club timezone
  defaultCloseTime String   @default("20:00") // "HH:mm" or "24:00"
  updatedAt        DateTime @updatedAt
}

// A date the club may be booked on. No row, or isActive = false, means inactive.
// Deactivating keeps the hours so re-activating restores them.
model ClubDay {
  date      DateTime @id @db.Date // club-local calendar date
  isActive  Boolean  @default(true)
  openTime  String   // "HH:mm", club timezone
  closeTime String   // "HH:mm" or "24:00"; never past midnight
  updatedAt DateTime @updatedAt
}

model Table {
  id          String    @id @default(uuid())
  name        String
  description String?
  isActive    Boolean   @default(true)
  bookings    Booking[]
}

// The club-local date of a booking is derived from startsAt in CLUB_TIMEZONE
// (shared/lib/time); it is not stored.
model Booking {
  id           String        @id @default(uuid())
  tableId      String
  startsAt     DateTime      // UTC
  endsAt       DateTime      // UTC
  note         String?
  status       BookingStatus
  adminComment String?       // visible to the booker and admins

  // Exactly one of: member booking (userId) or walk-in booking (walkInName)
  userId        String?
  walkInName    String?      // admins only
  walkInContact String?      // admins only

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user  User? @relation(fields: [userId], references: [id])
  table Table @relation(fields: [tableId], references: [id])

  @@index([tableId, startsAt])
  @@index([startsAt])
  @@index([userId])
}

model User {
  id         String    @id @default(uuid())
  email      String    @unique // identity; sign-in key; immutable
  username   String    @unique
  fullName   String?
  phone      String?
  telegram   String?
  adminNotes String?   // admins only
  image      String?
  role       Role      @default(MEMBER)
  createdAt  DateTime  @default(now())

  bookings   Booking[]
}

enum Role {
  MEMBER
  ADMIN
}

// Completed and Expired are derived, not stored — see docs/adr/0001
enum BookingStatus {
  PENDING
  APPROVED
  CANCELLED
}
```

DB check constraint: `(userId IS NOT NULL) <> (walkInName IS NOT NULL)`
(already in the init migration).

### Migrations from the init schema

The init migration (`20261114000000_init`, slice 0) is applied and must not
be edited. Each slice adds a new migration for its part:

| Slice | Migration |
| ----- | --------- |
| 2 | Drop `OpeningHours` and `ClosedDate`; add `defaultOpenTime`/`defaultCloseTime` to `ClubSettings`; add `ClubDay` |
| 4 | `User.name` → `username` (unique; backfill and de-duplicate existing rows); add `fullName`, `phone`, `telegram`, `adminNotes`, `createdAt`; rename `Role.USER` → `MEMBER` and change the default |
| 6 | `Booking.walkInPhone` → `walkInContact`; drop `statusReason`, `editedByAdminAt`, `editReason`, `isWholeDay`; add `adminComment`; drop the `status` default; add `@@index([startsAt])` |
| 8 | Drop `REJECTED` from `BookingStatus` (existing rows → `CANCELLED`) |

Production has never run any v1 migration, so the whole list may be
squashed into one init migration just before `v1` merges into `main`
(reset the Neon `dev` branch at the same time).

## Config (not in database)

| Key                    | Default | Meaning                              |
| ---------------------- | ------- | ------------------------------------ |
| `CLUB_TIMEZONE`        | `Europe/Kyiv` | IANA timezone of the club (Ukraine; UTC+2, UTC+3 in summer) |
| `BOOKING_WINDOW_DAYS`  | 30      | Last bookable / activatable day = today + N |
| `SLOT_STEP_MINUTES`    | 30      | Start/end granularity (time step)    |
| `MIN_BOOKING_MINUTES`  | 60      | Minimum booking duration             |
| `ADMIN_EMAILS`         | —       | Comma-separated emails that are always admins |

## Derived statuses and flags

Computed at read time, never stored
([ADR 0001](./adr/0001-derived-completed-and-expired-statuses.md)):

| Stored     | Condition         | Shown as   |
| ---------- | ----------------- | ---------- |
| PENDING    | `now ≥ startsAt`  | Expired    |
| APPROVED   | `now ≥ endsAt`    | Completed  |
| otherwise  | —                 | stored status |

A **blocking booking** is `APPROVED`, or `PENDING` and not expired.

One flag, on a blocking booking, computed from its date's `ClubDay`:

| Flag                | Condition                                         | Shown to       |
| ------------------- | ------------------------------------------------- | -------------- |
| **On inactive day** | the day has no `ClubDay` or `isActive = false`    | Admins, booker |

A booking left outside a day's hours after the hours were narrowed is not
flagged; the admin saw it in the confirmation when changing the hours.

**Needs attention** = bookings from today onward that are pending (not
expired) **or** blocking on an inactive day. The count is of distinct
bookings: one that is both counts once.

## Business rules

### Booking checks

A new booking is valid only if **all** hold:

1. Table exists and `isActive`.
2. Start is not in the past.
3. Date is between today and today + `BOOKING_WINDOW_DAYS`.
4. The date's `ClubDay` exists and `isActive`.
5. `startsAt`/`endsAt` lie within that day's current hours, on the same
   date.
6. Times align to `SLOT_STEP_MINUTES`; duration ≥ `MIN_BOOKING_MINUTES`.
7. No other blocking booking on the same table overlaps
   (`existing.startsAt < new.endsAt && new.startsAt < existing.endsAt`).

"Whole day" in the modal only fills in the day's `openTime`–`closeTime`;
the booking is checked and stored like any other.

There are no overrides — admins go through the same checks.

### Preventing double booking

The overlap check and the write run in one transaction that first locks the
table's row (`SELECT … FROM "Table" WHERE id = $1 FOR UPDATE`). Concurrent
bookings for the same table therefore run one after the other. No database
exclusion constraint: it couldn't tell an expired pending booking (stored as
`PENDING`) from a blocking one.

### Who can do what

| Action                       | Member                                   | Admin                                     |
| ---------------------------- | ---------------------------------------- | ----------------------------------------- |
| Create own booking           | Yes → `PENDING`                          | Yes → `APPROVED`                          |
| Book for a member or walk-in | No                                       | Yes → `APPROVED`                          |
| Edit booking                 | No                                       | Any pending/approved, before start; status kept |
| Cancel booking               | Own, pending/approved, before start      | Any pending/approved, before start        |
| Approve                      | No                                       | Pending, not expired                      |
| Set admin comment            | No                                       | Any booking, any time                     |
| Activate / deactivate / change hours of a day | No                      | Today → end of window                     |

### Edits (admins only)

- Editable: table, date, start/end time, note, walk-in name/contact. The
  member of a booking can't be changed.
- An edit that changes table, date or time is re-validated with all the
  booking checks (rule 7 ignores the booking itself). An edit that changes
  only the note or walk-in details skips them, so a flagged booking can
  still be annotated without moving it.
- Status is unchanged. No change history.

### Status transitions

| From       | To         | Who                         | Condition                 |
| ---------- | ---------- | --------------------------- | ------------------------- |
| PENDING    | APPROVED   | Admin                       | not expired               |
| PENDING    | CANCELLED  | Owner or Admin              | before `startsAt`         |
| APPROVED   | CANCELLED  | Owner or Admin              | before `startsAt`         |

`CANCELLED`, Expired and Completed are terminal and read-only (admins may
still set the admin comment). There is no rejected status: an admin
declines a pending booking by cancelling it, and the admin comment says
why (merged 2026-11-16, migration `20261116210000_merge_rejected_into_cancelled`). Walk-in bookings have no owner;
only admins can cancel them. Bookings are never deleted.

### Club day changes

Activating, deactivating or changing a day's hours never modifies bookings.

- Narrowing hours: the admin confirms after seeing the blocking bookings
  that would fall outside the new hours.
- Deactivating: the day's blocking bookings get the **On inactive day**
  flag and count in Needs attention.

Admins resolve them by editing, cancelling, or leaving them with an admin
comment.

### Accounts and roles

- `User.email` is the identity. On Google sign-in, an existing user with
  that email is reused; otherwise a user is created with a username
  derived from Google (made unique).
- On every sign-in, emails in `ADMIN_EMAILS` get role `ADMIN`. Those users
  can't be demoted in the UI. An admin can't change their own role.
- Profile visibility: `username` to all signed-in users; `adminNotes` to
  admins only; all other fields to the member and admins.

### Booker autocomplete (admin modal)

Searches `User.username` and `User.fullName`. A typed name that matches no
member makes a walk-in booking.
