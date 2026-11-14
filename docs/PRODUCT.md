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
| Admin      | Member whose email is in `ADMIN_EMAILS` | Everything a member can + approve/reject/cancel any booking, manage tables and club settings |

## Scope (v1)

### Club info & settings

- One club. Its name, location, description, weekly opening hours and closed
  dates are stored in the database and edited by admins on a Settings page.
- Opening hours are set per weekday (a weekday may be closed).
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
| Admin: bookings  | Admin   | Pending queue; approve/reject; cancel with reason          |
| Admin: tables    | Admin   | Create/edit/deactivate tables                              |
| Admin: settings  | Admin   | Club info, weekly opening hours, closed dates; affected-bookings list |

## Out of scope (v1)

- Multiple clubs.
- Email/password sign-in.
- Linking opponents to a booking / "looking for opponent".
- Notifications (email, Telegram — Telegram is a likely future addition).
- Per-member booking limits.
- Role-management UI.
- Migration of data from the previous version (fresh database).
- Translations.

## Open questions

_None at the moment._
