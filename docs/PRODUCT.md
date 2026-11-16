# Warband — Product Spec (Draft, v1 rewrite)

> Status: draft. Describes the rewrite. The current codebase is a previous
> version and supported multiple clubs; v1 supports **exactly one club**.

## Purpose

Warband is the booking app for a single wargaming club. Admins activate the club
day by day and set each day's working hours. Members sign in and reserve a
physical gaming table for a whole day or a chosen time range; admins approve
bookings, book for members and walk-ins, and manage members, tables and club
details.

## Users

| Role    | Who                       | Can do                                                                 |
| ------- | ------------------------- | ---------------------------------------------------------------------- |
| Visitor | Not signed in             | See club info and booked slots on active days (no names, no actions)     |
| Member  | Signed in with Google     | Everything a visitor can + see bookers' usernames; create, edit and cancel own bookings; edit own profile |
| Admin   | Member with the admin role | Everything a member can + activate/deactivate days, approve/reject/edit/cancel any booking, book for anyone, manage members, tables and club settings, see the archive |

## Scope (v1)

### Club settings

- One club. `/admin/settings` holds the club's name, location, description
  and the **default working hours** used when a day is activated
  (12:00–20:00 unless changed).
- Booking window, slot step and minimum duration are app config, not
  settings (see `DOMAIN.md`).

### Club days

- Every date is **inactive** until an admin activates it. Activating a day sets its
  working hours, prefilled from the defaults and editable. Hours end by
  midnight at the latest.
- Admins can activate, change the hours of, or deactivate any day from today up to
  the end of the booking window. Past days can't be changed.
- Changing hours or deactivating a day never changes bookings:
  - A time-range booking now outside the day's hours is kept as is and
    flagged **⚠ Outside working hours** (shown to admins and the booker).
  - Bookings on a day that was deactivated are flagged and counted in
    **Needs attention** until an admin cancels or moves each one. This is
    the case that matters; the hours flag is a corner case.

### Day view (Home)

- Home is the day view, at `/?date=YYYY-MM-DD`. A one-week **day strip**
  with ‹ › arrows sits on top; dates run from today to the end of the
  booking window. Past days are not in the strip (see Archive).
- Marks under each day: none = inactive, green = active with free time,
  grey = active and fully booked. Members also see a dot on days with their
  own booking. Admins also see a pending-count badge and ⚠ on inactive days
  that still have bookings.
- Without `date`, members and visitors land on the first active day from
  today; admins land on today. If no day is active, show today with a "no
  days open for booking yet" message.
- A compact club header (name, location) sits above the strip; the
  description lives on `/about`.
- The day lists the active tables, each with its bookings in time order.
  What each role sees and can do:

**Visitor**
- Active day: tables with "Booked" time slots. No names, no buttons.
- Inactive day: "Sorry, Warband is chilling today, see you next time".

**Member**
- Active day: tables with bookers' usernames. Own bookings carry a
  Pending/Approved tag and, if set, the admin comment.
- **Add** on each table that has a free gap of at least the minimum
  duration → booking modal for that table and day.
- **Edit** on own pending/approved bookings until they start → the same
  modal, prefilled. Any member edit sets the booking back to Pending.
- **Cancel** on own pending/approved bookings until they start, with a
  confirmation.
- Inactive day: the "chilling" message, plus the member's own bookings on
  that day (if the day was deactivated after they booked).

**Admin**
- Day header: **Activate** with default hours (editable) on an inactive
  day; **Edit hours** and **Deactivate** on an active day.
- Each table: **Add** and **Clear**. Clear cancels every blocking booking
  on that table for that day, after a confirmation listing them, with an
  optional comment.
- Each booking row: **Approve** / **Reject** (pending only), **Edit**,
  **Cancel** (with confirmation), and the admin comment. Flagged bookings
  show ⚠.
- An inactive day that still has bookings shows its tables and bookings to
  admins so they can deal with them.

### Booking

- A booking is for one table on one date, either:
  - **Whole day** — the whole date (00:00–24:00). It blocks the table for
    the entire date whatever the working hours are, so it never conflicts
    with hours. Can only be created on an active day, on a table with no
    other blocking bookings that day.
  - **Time range** — a custom start and end within the day's current
    working hours.
- Rules (for creating and editing):
  - Day is active (whole day and time range alike).
  - Time range lies within the day's current hours.
  - 30-minute steps, minimum 1 hour (configurable).
  - Within the booking window (today → +1 month), for everyone.
  - Table is active.
  - No overlap with any blocking booking on the same table (first come,
    first served).
- Optional free-text note (e.g. game system, number of players).
- Members' own bookings start as `PENDING`. Bookings created by an admin —
  for themselves, a member or a walk-in — start as `APPROVED`.
- No per-member limit on upcoming bookings in v1.

### Booking modal (admin Add / Edit)

- **Booker** field with autocomplete over members (username, full name)
  and past walk-ins (name + contact), each tagged `Member` / `Walk-in`.
  Picking a member links the booking to them; picking a past walk-in
  fills name and contact.
- Typing a new name makes a **walk-in booking** (name + optional contact).
  A **"Save this as a member"** checkbox reveals a required email field and
  instead creates a member account by email (see Members) and books for
  that member.
- Whole day switch, or start/end time; note.
- Members' modal has no Booker field: they always book for themselves.

### Booking lifecycle

```
PENDING ──approve──▶ APPROVED
   │  ▲                 │
   │  └──member edit────┤
   ├──reject──▶ REJECTED │
   │                    │
   └──cancel──▶ CANCELLED ◀──cancel──┘
```

- Members can edit or cancel their own `PENDING`/`APPROVED` bookings until
  they start. A member edit always returns the booking to `PENDING`.
- Admins can approve or reject `PENDING`, and edit or cancel any
  `PENDING`/`APPROVED` booking until it starts. Admin edits keep the status.
  The member of a booking can't be changed by an edit.
- `REJECTED` and `CANCELLED` bookings free the slot. Bookings are never
  deleted.
- Two statuses are derived from time, not set by anyone
  ([ADR 0001](./adr/0001-derived-completed-and-expired-statuses.md)):
  - **Expired**: still pending when its start time arrives. Stops blocking.
  - **Completed**: approved and its end time has passed.
- **Admin comment**: one free-text comment per booking, which admins can
  set at any time (when rejecting, cancelling, editing, explaining a
  conflict…). Visible to the booker and admins only. No change history.
- Completed, expired, rejected and cancelled bookings are read-only.

### Needs attention

- Admin nav item **Needs attention (N)**: N = pending (not expired)
  bookings + blocking bookings on inactive days. Clicking it jumps to the
  next day that has one. There is no separate approval queue page.

### Members

- Accounts are identified by **email** only. Sign-in is Google; a member
  account can also be created in advance by an admin (Members page or
  "Save this as a member"). The first Google sign-in with that email
  claims the account and its bookings.
- Profile (`/profile`, own; admins can edit anyone's):

  | Field         | Required | Visible to              | Notes                                   |
  | ------------- | -------- | ----------------------- | --------------------------------------- |
  | Username      | Yes      | Everyone signed in      | Unique; prefilled from Google; shown on the day view |
  | Email         | Yes      | Member, admins          | Sign-in key; can't be changed           |
  | Full name     | No       | Member, admins          |                                         |
  | Phone         | No       | Member, admins          |                                         |
  | Telegram      | No       | Member, admins          |                                         |
  | Date of birth | No       | Member, admins          |                                         |
  | Notes         | No       | Member, admins          | Written by the member                   |
  | Admin notes   | No       | Admins only             | Written by admins                       |

- Members don't see other members' profiles; only usernames on bookings.

### Admins and roles

- `/admin/members` lists members and admins (searchable). Admins can add
  a member by email, edit profiles (not email) and change a member's role
  to admin or back.
- Emails in `ADMIN_EMAILS` are always admins and can't be demoted (a
  recovery path). Nobody can demote themselves.
- No deleting or blocking members in v1.

### Archive

- `/admin/archive`: read-only, paginated, compact table of all bookings
  before today — date, table, booker, time, final status, admin comment.
  Filters: date range, table, status. It's a view; nothing is moved.
- Members still see their own past bookings in My bookings.

### Tables

- Admin can create, edit and deactivate tables.
- A table has a name, optional description/size, and an active flag.
- Deactivated tables are hidden from the day view but keep their booking
  history.

### Notifications

- None in v1. Members see status on the day view and in My bookings.

### Language

- English only. No i18n setup in v1.

## Pages

| Page             | Access  | Purpose                                                    |
| ---------------- | ------- | ---------------------------------------------------------- |
| Home (day view)  | All     | Day strip + tables and bookings for the selected day; role-specific actions |
| About            | All     | Club description and location                              |
| Sign-in          | All     | Google sign-in                                             |
| My bookings      | Member  | Own upcoming and past bookings with status and admin comment; edit/cancel |
| Profile          | Member  | Edit own profile                                           |
| Admin: members   | Admin   | List/search members, add by email, edit profiles, change roles |
| Admin: archive   | Admin   | Past bookings, compact and filterable                      |
| Admin: tables    | Admin   | Create/edit/deactivate tables                              |
| Admin: settings  | Admin   | Club info, default working hours                           |

## Out of scope (v1)

- Multiple clubs.
- Email/password sign-in.
- Linking opponents to a booking / "looking for opponent".
- Booking change history.
- Working hours past midnight.
- Recurring/weekly opening schedules (days are activated one by one).
- Notifications (email, Telegram).
- Per-member booking limits.
- Deleting or blocking members.
- Migration of data from the previous version (fresh database).
- Translations.

## Next version ideas

- **Regulars and member linking** — needs brainstorming: a curated
  "regulars" list, merging walk-ins into members, members who never sign in.
- **Richer contact info** for walk-ins and members.
- **Activating days in bulk** (e.g. "activate every Sat in December").
- **Blocking / removing members.**
- **Notifications** — Telegram is the likely first channel.

## Open questions

_None at the moment._
