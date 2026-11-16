# Warband — Domain Model (Draft, v1 rewrite)

Domain terms are defined in [`GLOSSARY.md`](../GLOSSARY.md).

## Entities (proposed Prisma schema)

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

model Booking {
  id           String        @id @default(uuid())
  tableId      String
  date         DateTime      @db.Date // club-local date the booking belongs to
  startsAt     DateTime      // UTC
  endsAt       DateTime      // UTC; whole day = local 00:00 → next 00:00
  isWholeDay   Boolean       @default(false)
  note         String?
  status       BookingStatus
  adminComment String?       // visible to the booker and admins

  // Exactly one of: member booking (userId) or walk-in booking (walkInName)
  userId        String?
  walkInName    String?
  walkInContact String?      // admins only

  createdById  String        // who created it (member or admin)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user      User? @relation("BookingFor", fields: [userId], references: [id])
  createdBy User  @relation("BookingCreatedBy", fields: [createdById], references: [id])
  table     Table @relation(fields: [tableId], references: [id])

  @@index([tableId, startsAt])
  @@index([date])
}

model User {
  id          String    @id @default(uuid())
  email       String    @unique // identity; sign-in key; immutable
  username    String    @unique
  fullName    String?
  phone       String?
  telegram    String?
  dateOfBirth DateTime? @db.Date
  notes       String?   // written by the member
  adminNotes  String?   // admins only
  image       String?
  role        Role      @default(MEMBER)
  signedInAt  DateTime? // null = created in advance by an admin, never signed in
  createdAt   DateTime  @default(now())

  bookings        Booking[] @relation("BookingFor")
  createdBookings Booking[] @relation("BookingCreatedBy")
}

enum Role {
  MEMBER
  ADMIN
}

// Completed and Expired are derived, not stored — see docs/adr/0001
enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

DB check constraint: `(userId IS NOT NULL) <> (walkInName IS NOT NULL)`.

### Changes from the previous version

- `Club` model removed; `Table.clubId` removed. Club details live in
  `ClubSettings`.
- Weekly opening hours and closed dates are replaced by `ClubDay`
  ([ADR 0002](./adr/0002-days-activated-individually.md)).
- `Booking.date` + `approved: Boolean` replaced by `date`, `startsAt`/`endsAt`,
  `isWholeDay` and `status: BookingStatus`.
- `Booking.userId` is optional; walk-in bookings use `walkInName`/`walkInContact`.
- `User.password` removed (Google sign-in only). `User` gains profile
  fields, `username`, `adminNotes`, `signedInAt`.
- New: `Table.isActive`, `Booking.note`, `Booking.adminComment`,
  `Booking.createdById`.

## Config (not in database)

| Key                    | Default | Meaning                              |
| ---------------------- | ------- | ------------------------------------ |
| `CLUB_TIMEZONE`        | `Europe/Kyiv` | IANA timezone of the club (Ukraine; UTC+2, UTC+3 in summer) |
| `BOOKING_WINDOW_DAYS`  | 30      | Last bookable / activatable day = today + N |
| `SLOT_STEP_MINUTES`    | 30      | Start/end granularity                |
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

Flags on a blocking booking, computed from its `ClubDay`:

| Flag                     | Condition                                                         | Shown to          |
| ------------------------ | ----------------------------------------------------------------- | ----------------- |
| **On inactive day**      | the day has no `ClubDay` or `isActive = false`                    | Admins, booker    |
| **Outside working hours**| time-range booking not within `openTime`–`closeTime` of an active day | Admins, booker |

Whole-day bookings never get the hours flag.

**Needs attention** count = pending (not expired) bookings + blocking
bookings on inactive days, from today onward.

## Business rules

### Booking checks

A booking (new or edited, by anyone) is valid only if **all** hold:

1. Table exists and `isActive`.
2. Start is not in the past.
3. Date is between today and today + `BOOKING_WINDOW_DAYS`.
4. The date's `ClubDay` exists and `isActive`.
5. Time range: `startsAt`/`endsAt` lie within that day's current hours.
   Whole day: range is local 00:00 → next 00:00.
6. Time range: times align to `SLOT_STEP_MINUTES`; duration ≥
   `MIN_BOOKING_MINUTES`.
7. No other blocking booking on the same table overlaps
   (`existing.startsAt < new.endsAt && new.startsAt < existing.endsAt`).
   Because whole day covers the entire date, this also means a whole-day
   booking needs an otherwise empty table and blocks all range bookings.

Rule 7 must be checked inside a transaction (or enforced with a Postgres
exclusion constraint) to avoid double-booking under concurrent requests.
There are no overrides — admins go through the same checks.

### Who can do what

| Action                       | Member                                   | Admin                                     |
| ---------------------------- | ---------------------------------------- | ----------------------------------------- |
| Create own booking           | Yes → `PENDING`                          | Yes → `APPROVED`                          |
| Book for a member or walk-in | No                                       | Yes → `APPROVED`                          |
| Edit booking                 | Own, pending/approved, before start → `PENDING` | Any pending/approved, before start; status kept |
| Cancel booking               | Own, pending/approved, before start      | Any pending/approved, before start        |
| Clear a table for a day      | No                                       | Cancels all its blocking bookings that day |
| Approve / reject             | No                                       | Pending, not expired                      |
| Set admin comment            | No                                       | Any booking, any time                     |
| Activate / deactivate / change hours of a day | No                      | Today → end of window                     |

### Edits

- Editable: table, date, whole-day flag, start/end time, note; admins also
  walk-in name/contact. The member of a booking can't be changed.
- Every edit is re-validated with the booking checks above.
- Member edit → status becomes `PENDING`. Admin edit → status unchanged.
- No change history.

### Status transitions

| From       | To         | Who                         | Condition                 |
| ---------- | ---------- | --------------------------- | ------------------------- |
| PENDING    | APPROVED   | Admin                       | not expired               |
| PENDING    | REJECTED   | Admin                       | not expired               |
| APPROVED   | PENDING    | Owner (by editing)          | before `startsAt`         |
| PENDING    | CANCELLED  | Owner or Admin              | before `startsAt`         |
| APPROVED   | CANCELLED  | Owner or Admin              | before `startsAt`         |

`REJECTED`, `CANCELLED`, Expired and Completed are terminal and read-only
(admins may still set the admin comment). Walk-in bookings have no owner;
only admins can edit or cancel them. Bookings are never deleted.

### Club day changes

Activating, deactivating or changing a day's hours never modifies bookings.
Affected bookings get the flags above; admins resolve them by editing,
cancelling, or leaving them with an admin comment.

### Accounts and roles

- `User.email` is the identity. On Google sign-in, an existing user with
  that email is reused (an account created in advance is claimed:
  `signedInAt` set); otherwise a user is created with a username derived
  from Google (made unique).
- Admins create accounts in advance by email (Members page, or "Save this
  as a member" in the booking modal). Creating one for an existing email
  links to that user instead.
- On every sign-in, emails in `ADMIN_EMAILS` get role `ADMIN`. Those users
  can't be demoted in the UI. An admin can't change their own role.
- Profile visibility: `username` to all signed-in users; `adminNotes` to
  admins only; all other fields to the member and admins.

### Booker autocomplete (admin modal)

Searches `User.username`/`User.fullName` and distinct
`(walkInName, walkInContact)` pairs from past walk-in bookings. Results are
tagged `Member` or `Walk-in`.
