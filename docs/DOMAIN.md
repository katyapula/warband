# Warband — Domain Model (Draft, v1 rewrite)

Domain terms are defined in [`GLOSSARY.md`](../GLOSSARY.md).

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
  closeTime  String?      // "HH:mm" or "24:00", club timezone; never past midnight

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
  tableId      String
  startsAt     DateTime      // UTC
  endsAt       DateTime      // UTC
  isWholeDay   Boolean       @default(false)
  note         String?
  status       BookingStatus @default(PENDING)
  statusReason String?       // reason for reject/cancel

  // Exactly one of: member booking (userId) or walk-in booking (walkInName)
  userId       String?
  walkInName   String?
  walkInPhone  String?       // admins only

  // Last admin edit (no full history in v1)
  editedByAdminAt DateTime?
  editReason      String?

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user  User? @relation(fields: [userId], references: [id])
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

// Completed and Expired are derived, not stored — see docs/adr/0001
enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

Add a DB check constraint: `(userId IS NOT NULL) <> (walkInName IS NOT NULL)`.

### Changes from the previous version

- `Club` model removed; `Table.clubId` removed. Club details live in
  `ClubSettings`.
- `Booking.date` + `approved: Boolean` replaced by `startsAt`/`endsAt`,
  `isWholeDay` and `status: BookingStatus`.
- `Booking.userId` is optional; walk-in bookings use `walkInName`/`walkInPhone`.
- `User.password` removed (Google sign-in only).
- New: `OpeningHours`, `ClosedDate`, `Table.isActive`, `Booking.note`,
  `Booking.statusReason`, `Booking.editedByAdminAt`, `Booking.editReason`.

## Config (not in database)

| Key                    | Default | Meaning                              |
| ---------------------- | ------- | ------------------------------------ |
| `CLUB_TIMEZONE`        | `Europe/Kyiv` | IANA timezone of the club (Ukraine; UTC+2, UTC+3 in summer) |
| `BOOKING_WINDOW_DAYS`  | 30      | Max days ahead a member's booking can start |
| `SLOT_STEP_MINUTES`    | 30      | Start/end granularity                |
| `MIN_BOOKING_MINUTES`  | 60      | Minimum booking duration             |
| `ADMIN_EMAILS`         | —       | Comma-separated admin emails         |

## Derived statuses

Computed at read time from the stored status and the current time
([ADR 0001](./adr/0001-derived-completed-and-expired-statuses.md)):

| Stored     | Condition         | Shown as   |
| ---------- | ----------------- | ---------- |
| PENDING    | `now ≥ startsAt`  | Expired    |
| APPROVED   | `now ≥ endsAt`    | Completed  |
| otherwise  | —                 | stored status |

A **blocking booking** is `APPROVED`, or `PENDING` and not expired.

## Business rules

### Booking checks

A booking (new or edited) is valid only if **all** hold:

1. Table exists and `isActive`.
2. Start is not in the past.
3. Date is within the booking window — **members only**; admins are exempt.
4. Date is not a `ClosedDate` and its weekday is not closed.
5. `startsAt`/`endsAt` lie within that date's opening hours.
6. Whole-day booking ⇒ range equals opening → closing.
7. Times align to `SLOT_STEP_MINUTES`; duration ≥ `MIN_BOOKING_MINUTES`.
8. No other blocking booking on the same table overlaps
   (`existing.startsAt < new.endsAt && new.startsAt < existing.endsAt`).

Rule 8 must be checked inside a transaction (or enforced with a Postgres
exclusion constraint) to avoid double-booking under concurrent requests.
Admins cannot override any check other than rule 3.

### Who can do what

| Action                | Member                     | Admin                                       |
| --------------------- | -------------------------- | ------------------------------------------- |
| Create own booking    | Yes → `PENDING`            | Yes → `PENDING` (same flow as members)      |
| Create walk-in booking| No                         | Yes → `APPROVED`                            |
| Edit booking          | No                         | Pending/approved, not yet started           |
| Cancel booking        | Own, pending/approved, before start | Any pending/approved, optional reason |
| Approve / reject      | No                         | Pending, not expired; optional reason on reject |

### Admin edits

- Editable fields: table, date, start/end time, whole-day flag, note, and
  for walk-in bookings the walk-in name/phone. The member of a member
  booking cannot be changed.
- The edit is re-validated with the booking checks above.
- Status is unchanged by an edit.
- `editedByAdminAt` and an optional `editReason` are set; the member sees
  "Changed by admin" plus the reason in My bookings. No change history.

### Status transitions

| From       | To         | Who                         | Condition                 |
| ---------- | ---------- | --------------------------- | ------------------------- |
| PENDING    | APPROVED   | Admin                       | not expired               |
| PENDING    | REJECTED   | Admin                       | not expired; optional reason |
| PENDING    | CANCELLED  | Owner or Admin              | before `startsAt`         |
| APPROVED   | CANCELLED  | Owner or Admin              | before `startsAt`         |

`REJECTED`, `CANCELLED`, Expired and Completed are terminal and read-only.
Walk-in bookings have no owner; only admins can cancel them.

### Settings changes

Changing opening hours or adding a closed date never modifies bookings. The
system lists blocking bookings that now fall outside opening hours or on a
closed date, so the admin can edit or cancel them.
