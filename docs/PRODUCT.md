# Warband — Product Spec (Draft, v1 rewrite)

> Status: draft. Describes the rewrite. The current codebase is a previous
> version and supported multiple clubs; v1 supports **exactly one club**.

## Purpose

Warband is the booking app for a single wargaming club. Members sign in and
reserve a physical gaming table for a whole day or a chosen time range. Club
admins approve bookings and manage tables, opening hours and club details.

## Users

| Role       | Who                                   | Can do                                                                 |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Visitor    | Not signed in                         | See club info and table availability (booked/free only, no names)      |
| Member     | Signed in with Google                 | Everything a visitor can + see who booked, create and cancel own bookings |
| Admin      | Member whose email is in `ADMIN_EMAILS` | Everything a member can + approve/reject/edit/cancel any booking, create walk-in bookings, manage tables and club settings |

## Scope (v1)

### Club info & settings

- One club. Its name, location, description, weekly opening hours and closed
  dates are stored in the database and edited by admins on a Settings page.
- Opening hours are set per weekday (a weekday may be closed). Closing time
  is midnight at the latest — no opening hours past midnight.
- Admins can mark specific dates as closed (holidays, private events). No
  bookings can be made on closed dates.
- Changing hours or adding a closed date does **not** cancel existing bookings.
  The admin is shown the affected bookings and cancels them manually, with a
  reason, if needed.

### Availability

- Home page shows club info and an availability grid: tables × time for a
  selected date.
- Selectable dates: today up to 1 month ahead (configurable).
- Visitors see only booked/free. Members also see the booker's name.

### Booking

- A member books one table either:
  - **Whole day** — from opening to closing time on that date, or
  - **Time range** — a custom start and end time.
- Rules:
  - Must fall within opening hours of that date; date must not be closed.
  - 30-minute granularity, minimum duration 1 hour (configurable).
  - Within the booking window (today → +1 month).
  - Table must be active.
  - Must not overlap any `PENDING` or `APPROVED` booking on the same table
    (first come, first served).
- Optional free-text note (e.g. game system, number of players).
- New bookings start as `PENDING`.
- No per-member limit on upcoming bookings in v1.

### Booking lifecycle

```
PENDING ──approve──▶ APPROVED
   │                    │
   ├──reject──▶ REJECTED │
   │                    │
   └──cancel──▶ CANCELLED ◀──cancel──┘
```

- Member can cancel their own `PENDING` or `APPROVED` booking until it starts.
- Admin can approve or reject `PENDING`, and cancel any `PENDING`/`APPROVED`
  booking, with an optional reason.
- `REJECTED` and `CANCELLED` bookings free the slot.
- Two statuses are derived from time, not set by anyone
  ([ADR 0001](./adr/0001-derived-completed-and-expired-statuses.md)):
  - **Expired**: still pending when its start time arrives. Stops blocking.
  - **Completed**: approved and its end time has passed. Shown to the
    member and admins.
- Members cannot edit bookings — to change one, they cancel and book again.

### Admin editing

- Admins can edit any pending or approved booking that hasn't started:
  table, date, start/end time, whole day vs time range, note (and the
  walk-in name/phone for walk-in bookings). The member of a booking can't
  be changed.
- Edits go through all booking rules except the booking window (admins may
  move bookings further ahead). No overrides.
- Status stays the same after an edit.
- The member sees "Changed by admin" with an optional reason in My
  bookings. No full change history in v1.
- Completed, expired, rejected and cancelled bookings are read-only.

### Walk-in bookings

- Admins can book a table for a walk-in: a person without an account,
  identified by a typed name, with an optional phone number.
- Walk-in bookings are approved immediately, follow the same rules as admin
  edits, and are not linked to any account.
- Only admins can edit or cancel them; the phone number is visible to
  admins only. Members see the walk-in name in the grid like any booker.

### Tables

- Admin can create, edit and deactivate tables.
- A table has a name, optional description/size, and an active flag.
- Deactivated tables are hidden from booking but keep their booking history.

### Admins

- Assigned by email via the `ADMIN_EMAILS` environment variable; role is
  applied at sign-in. No role-management UI in v1.

### Notifications

- None in v1. Members see status on the "My bookings" page.

### Language

- English only. No i18n setup in v1.

## Pages

| Page             | Access  | Purpose                                                    |
| ---------------- | ------- | ---------------------------------------------------------- |
| Home             | All     | Club info + availability grid by date and table            |
| Sign-in          | All     | Google sign-in                                             |
| Book             | Member  | Form: table, date, whole day or time range, note           |
| My bookings      | Member  | Upcoming and past bookings with status; cancel action      |
| Admin: bookings  | Admin   | Pending queue; approve/reject; edit; cancel with reason; create walk-in booking |
| Admin: tables    | Admin   | Create/edit/deactivate tables                              |
| Admin: settings  | Admin   | Club info, weekly opening hours, closed dates; affected-bookings list |

## Out of scope (v1)

- Multiple clubs.
- Email/password sign-in.
- Linking opponents to a booking / "looking for opponent".
- Admin creating a booking on behalf of an existing member (v2).
- Members editing bookings.
- Booking change history.
- Opening hours past midnight.
- Notifications (email, Telegram — Telegram is a likely future addition).
- Per-member booking limits.
- Role-management UI.
- Migration of data from the previous version (fresh database).
- Translations.

## Open questions

_None at the moment._
