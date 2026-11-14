# Warband — Domain Model (Draft, v1 rewrite)

## Glossary

| Term             | Meaning                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Club**         | The single wargaming club the app serves. Not an entity with multiple rows — see ClubSettings. |
| **ClubSettings** | The one row holding club name, location, description and weekly opening hours.          |
| **Opening hours**| Per-weekday open/close times set by an admin. A weekday can be closed.                   |
| **Closed date**  | A specific calendar date on which the club is closed and nothing can be booked.          |
| **Table**        | A physical gaming table that can be booked.                                               |
| **Active table** | A table available for new bookings. Inactive tables keep history but can't be booked.    |
| **Booking**      | A reservation of one table by one member for a time range on one date.                    |
| **Whole-day booking** | A booking whose range equals the opening hours of that date.                         |
| **Time-range booking** | A booking with a member-chosen start and end time.                                 |
| **Booking window** | How far ahead bookings may be made (default: today → +1 month).                        |
| **Slot step**    | Time granularity for start/end (default: 30 min).                                         |
| **Member**       | A signed-in user (role `USER`).                                                           |
| **Admin**        | A user with role `ADMIN`, assigned via `ADMIN_EMAILS`.                                    |
| **Blocking booking** | A booking with status `PENDING` or `APPROVED`; it prevents overlapping bookings.      |

## Entities (proposed Prisma schema)

```prisma
model ClubSettings {
  id          Int      @id @default(1) // singleton
  name        String
  location    String
  description String
  updatedAt   DateTime @updatedAt
  openingHours OpeningHours[]
}

model OpeningHours {
  id         String       @id @default(uuid())
  settingsId Int
  settings   ClubSettings @relation(fields: [settingsId], references: [id])
  weekday    Int          // 0 = Monday … 6 = Sunday
  isClosed   Boolean      @default(false)
  openTime   String?      // "HH:mm", club timezone
  closeTime  String?      // "HH:mm", club timezone

  @@unique([settingsId, weekday])
}

model ClosedDate {
  id     String   @id @default(uuid())
  date   DateTime @db.Date @unique
  reason String?
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
  userId       String
  tableId      String
  startsAt     DateTime      // UTC
  endsAt       DateTime      // UTC
  isWholeDay   Boolean       @default(false)
  note         String?
  status       BookingStatus @default(PENDING)
  statusReason String?       // reason for reject/cancel
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user  User  @relation(fields: [userId], references: [id])
  table Table @relation(fields: [tableId], references: [id])

  @@index([tableId, startsAt])
}

model User {
  id       String    @id @default(uuid())
  email    String    @unique
  name     String
  image    String?
  role     Role      @default(USER)
  bookings Booking[]
}

enum Role {
  USER
  ADMIN
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### Changes from the previous version

- `Club` model removed; `Table.clubId` removed. Club details live in
  `ClubSettings`.
- `Booking.date` + `approved: Boolean` replaced by `startsAt`/`endsAt`,
  `isWholeDay` and `status: BookingStatus`.
- `User.password` removed (Google sign-in only).
- New: `OpeningHours`, `ClosedDate`, `Table.isActive`, `Booking.note`,
  `Booking.statusReason`.

## Config (not in database)

| Key                    | Default | Meaning                              |
| ---------------------- | ------- | ------------------------------------ |
| `CLUB_TIMEZONE`        | `Europe/Kyiv` | IANA timezone of the club (Ukraine; UTC+2, UTC+3 in summer) |
| `BOOKING_WINDOW_DAYS`  | 30      | Max days ahead a booking can start   |
| `SLOT_STEP_MINUTES`    | 30      | Start/end granularity                |
| `MIN_BOOKING_MINUTES`  | 60      | Minimum booking duration             |
| `ADMIN_EMAILS`         | —       | Comma-separated admin emails         |

## Business rules

A booking request is valid only if **all** hold:

1. User is signed in.
2. Table exists and `isActive`.
3. Date is within the booking window and not in the past.
4. Date is not a `ClosedDate` and its weekday is not closed.
5. `startsAt`/`endsAt` lie within that date's opening hours.
6. Whole-day booking ⇒ range equals opening → closing.
7. Times align to `SLOT_STEP_MINUTES`; duration ≥ `MIN_BOOKING_MINUTES`.
8. No blocking booking on the same table overlaps
   (`existing.startsAt < new.endsAt && new.startsAt < existing.endsAt`).

Rule 8 must be checked inside a transaction (or enforced with a Postgres
exclusion constraint) to avoid double-booking under concurrent requests.

### Status transitions

| From       | To         | Who                         | Condition                 |
| ---------- | ---------- | --------------------------- | ------------------------- |
| PENDING    | APPROVED   | Admin                       | —                         |
| PENDING    | REJECTED   | Admin                       | optional reason           |
| PENDING    | CANCELLED  | Owner or Admin              | owner: before `startsAt`  |
| APPROVED   | CANCELLED  | Owner or Admin              | owner: before `startsAt`  |

`REJECTED` and `CANCELLED` are terminal.

### Settings changes

Changing opening hours or adding a closed date never modifies bookings. The
system lists blocking bookings that now fall outside opening hours or on a
closed date, so the admin can cancel them with a reason.
