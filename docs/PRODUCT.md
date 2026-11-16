# Warband — Product Spec (v1)

## Purpose

Warband is the booking app for a single wargaming club. Admins activate the club
day by day and set each day's working hours. Members sign in and book a
physical gaming table for a time range on an active day; admins approve
bookings, book for members and walk-ins, and manage members, tables and club
details.

## Users

| Role    | Who                       | Can do                                                                 |
| ------- | ------------------------- | ---------------------------------------------------------------------- |
| Visitor | Not signed in             | See club info and booked times on active days (no names, no actions)   |
| Member  | Signed in with Google     | Everything a visitor can + see bookers' usernames; create and cancel own bookings; edit own profile |
| Admin   | Member with the admin role | Everything a member can + activate/deactivate days, approve/edit/cancel any booking, book for anyone, manage members, tables and club settings, browse past days |

## Scope (v1)

### Club settings

- One club. `/admin/settings` holds the club's name, location, description
  and the **default working hours** used when a day is activated
  (12:00–20:00 unless changed).
- Booking window, time step and minimum duration are app config, not
  settings (see `DOMAIN.md`).

### Club days

- Every date is **inactive** until an admin activates it. Activating a day sets its
  working hours, prefilled from the defaults and editable. Hours end by
  midnight at the latest.
- Admins can activate, change the hours of, or deactivate any day from today up to
  the end of the booking window. Past days can't be changed.
- Changing hours or deactivating a day never changes bookings:
  - Narrowing a day's hours shows a confirmation listing the bookings that
    fall outside the new hours. They stay as they are; the admin decides
    whether to edit or cancel them.
  - Bookings on a day that was deactivated are flagged **⚠ On inactive
    day** (shown to admins and the booker) and counted in **Needs
    attention** until an admin cancels or moves each one.

### Day view (Home)

- Home is the day view, at `/?date=YYYY-MM-DD`. A one-week **day strip**
  with ‹ › arrows sits on top; dates run from today to the end of the
  booking window. Admins can also go back into past days, read-only.
- Marks under each day: a dot = active. Members also see a mark on days
  with their own booking. Admins also see a pending-count badge and ⚠ on
  inactive days that still have bookings.
- Without `date`, members and visitors land on the first active day from
  today; admins land on today. If no day is active, show today with a "no
  days open for booking yet" message.
- A compact club header (name, location) sits above the strip; the
  description lives on `/about`.
- The day lists the active tables, each with its bookings in time order.
  What each role sees and can do:

**Visitor**
- Active day: tables with their booked times, each shown as "Booked". No
  names, no buttons.
- Inactive day: "Sorry, Warband is chilling today, see you next time".

**Member**
- Active day: tables with bookers' usernames; walk-in bookings show as
  "Booked". Own bookings carry a Pending/Approved tag and, if set, the
  admin comment.
- **Add** on each table that has a free gap of at least the minimum
  duration → booking modal for that table and day.
- **Cancel** on own pending/approved bookings until they start, with a
  confirmation. To change a booking, a member cancels it and books again.
- Inactive day: the "chilling" message, plus the member's own bookings on
  that day (if the day was deactivated after they booked).

**Admin**
- Day header: **Activate** with default hours (editable) on an inactive
  day; **Edit hours** and **Deactivate** on an active day.
- Each table: **Add**.
- Each booking row: **Approve** (pending only), **Edit** (its modal holds
  the admin comment), **Cancel** (with an optional admin comment; also how
  an admin declines a pending booking), and **Comment** where Edit isn't
  offered (past, cancelled, expired, completed). Flagged bookings show ⚠.
- An inactive day that still has bookings shows its tables and bookings to
  admins so they can deal with them.
- Past days are read-only, apart from the admin comment.

### Booking

- A booking is for one table on one date, with a start and end time
  within the day's working hours. The modal has a **Whole day** button
  that fills in the day's opening and closing time; the result is an
  ordinary booking.
- Rules (for creating, and for edits that change table, date or time):
  - Day is active.
  - Start and end lie within the day's current hours.
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

- **Booker** field with autocomplete over members (username, full name).
  Picking a member links the booking to them.
- Typing a name that isn't a member makes a **walk-in booking** (name +
  optional contact).
- Start/end time (or **Whole day**); note.
- Members' modal has no Booker field: they always book for themselves.

### Booking lifecycle

```
PENDING ──approve──▶ APPROVED
   │                    │
   └──cancel──▶ CANCELLED ◀──cancel──┘
```

- Members can cancel their own `PENDING`/`APPROVED` bookings until they
  start. Members can't edit bookings.
- Admins can approve `PENDING`, and edit or cancel any
  `PENDING`/`APPROVED` booking until it starts. There is no separate
  reject: an admin declines a pending booking by cancelling it, with an
  admin comment saying why. Admin edits keep the status.
  The member of a booking can't be changed by an edit.
- `CANCELLED` bookings free the table. Bookings are never
  deleted.
- Two statuses are derived from time, not set by anyone
  ([ADR 0001](./adr/0001-derived-completed-and-expired-statuses.md)):
  - **Expired**: still pending when its start time arrives. Stops blocking.
  - **Completed**: approved and its end time has passed.
- **Admin comment**: one free-text comment per booking, which admins can
  set at any time (when cancelling, editing, explaining a
  conflict…). Visible to the booker and admins only. No change history.
- Completed, expired and cancelled bookings are read-only.

### Needs attention

- Admin nav item **Needs attention (N)**: N = the number of bookings, from
  today onward, that are pending (not expired) or blocking on an inactive
  day (each booking counted once). Clicking it jumps to the next day that
  has one. There is no separate approval queue page.

### Members

- Accounts are identified by **email** only. The first Google sign-in
  creates the account; later sign-ins with the same email reuse it.
- Profile (`/profile`, own; admins can edit anyone's):

  | Field         | Required | Visible to              | Notes                                   |
  | ------------- | -------- | ----------------------- | --------------------------------------- |
  | Username      | Yes      | Everyone signed in      | Unique; prefilled from Google; shown on the day view |
  | Email         | Yes      | Member, admins          | Sign-in key; can't be changed           |
  | Full name     | No       | Member, admins          |                                         |
  | Phone         | No       | Member, admins          |                                         |
  | Telegram      | No       | Member, admins          |                                         |
  | Admin notes   | No       | Admins only             | Written by admins                       |

- Members don't see other members' profiles; only usernames on bookings.

### Admins and roles

- `/admin/members` lists members and admins (searchable). Admins can edit
  profiles (not email) and change a member's role to admin or back.
- Emails in `ADMIN_EMAILS` are always admins and can't be demoted (a
  recovery path). Nobody can demote themselves.
- No adding, deleting or blocking members in v1; people join by signing in.

### Past bookings

- Admins see past days by moving the day strip back; they're read-only
  apart from the admin comment. There is no separate archive page.
- Members see their own past bookings in My bookings.

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
| My bookings      | Member  | Own upcoming and past bookings with status and admin comment; cancel |
| Profile          | Member  | Edit own profile                                           |
| Admin: members   | Admin   | List/search members, edit profiles, change roles           |
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
- Adding, deleting or blocking members.
- Migration of data from the previous version (fresh database).
- Translations.

## Next version ideas

- **Regulars and member linking** — needs brainstorming: admins creating
  accounts by email before first sign-in ("Save this as a member" in the
  booking modal), autocomplete over past walk-ins, merging walk-ins into
  members, members who never sign in.
- **Member edit** of own bookings (back to Pending).
- **Clear a table** for a day in one action.
- **Archive page**: paginated, filterable list of past bookings.
- **"Outside working hours" flag** on bookings left outside narrowed hours.
- **Whole-day bookings** stored as the full date, independent of hours.
- **Fully booked mark** in the day strip.
- **More profile fields** (date of birth, member notes); richer contact
  info for walk-ins and members.
- **Activating days in bulk** (e.g. "activate every Sat in December").
- **Blocking / removing members.**
- **Notifications** — Telegram is the likely first channel.

## Open questions

_None at the moment._
