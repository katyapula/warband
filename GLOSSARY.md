# Warband

Warband is the booking app for a single wargaming club: members reserve gaming tables, admins approve bookings and run the club's schedule.

## People

**Visitor**:
Someone using the app without signing in. Can see availability but not who booked.
_Avoid_: Guest, anonymous user

**Member**:
Anyone with an account, admins included. An account is identified by its email and may be created by an admin before the person first signs in.
_Avoid_: User, customer, player

**Admin**:
A member with the admin role: activates days, reviews and edits bookings, books for others, and manages members, tables and club settings.
_Avoid_: Owner, moderator, staff

**Username**:
A member's unique public name, the only profile field other members see.
_Avoid_: Nickname, handle, display name

## Club

**Club**:
The single wargaming club the app serves.
_Avoid_: Venue, location, store

**Active day**:
A date an admin has opened for booking, with its own working hours.
_Avoid_: Open day, session, event

**Inactive day**:
A date the club is not open for booking — every date until an admin activates it, or one an admin deactivated.
_Avoid_: Closed date, holiday, day off

**Working hours**:
The start and end time of an active day; they end by midnight at the latest. Prefilled from the club's default working hours.
_Avoid_: Opening hours, schedule

**Table**:
A physical gaming table that members can book.
_Avoid_: Board, slot, spot

**Inactive table**:
A table withdrawn from booking that keeps its booking history.
_Avoid_: Deleted table, archived table

## Bookings

**Booking**:
A reservation of one table for a time range on a single date, made by a member for themselves or by an admin for themselves, a member or a walk-in.
_Avoid_: Reservation, order, slot

**Walk-in**:
A person without an account whom an admin books a table for, identified only by the name and optional contact the admin types.
_Avoid_: Guest, non-member, customer

**Walk-in booking**:
A booking an admin creates for a walk-in; it belongs to no member and is approved from the start.
_Avoid_: Manual booking, phone booking, admin booking

**Whole-day booking**:
A booking of a table for the entire date (00:00–24:00), regardless of working hours.
_Avoid_: Full-day, all-day

**Time-range booking**:
A booking with a chosen start and end time within the day's working hours.
_Avoid_: Partial booking, slot booking

**Booking window**:
How far ahead a booking may start and a day may be activated.
_Avoid_: Horizon, lead time

**Pending**:
A booking awaiting an admin's decision — a new member booking, or one the member edited.

**Approved**:
A booking an admin has accepted.
_Avoid_: Confirmed, accepted

**Rejected**:
A pending booking an admin declined.
_Avoid_: Denied, declined

**Cancelled**:
A booking withdrawn by its member or an admin before it took place. Bookings are never deleted.
_Avoid_: Deleted, removed

**Expired**:
A pending booking whose start time passed without an admin decision.
_Avoid_: Stale, timed out

**Completed**:
An approved booking whose end time has passed.
_Avoid_: Finished, done, past booking

**Blocking booking**:
An approved booking, or a pending one that hasn't expired; it prevents overlapping bookings on the same table.

**Admin comment**:
A note an admin attaches to a booking (reason for rejecting, cancelling, editing or a conflict), visible to the booker and admins.
_Avoid_: Reason, status note

**Needs attention**:
Bookings an admin must act on: pending bookings and blocking bookings on inactive days.
_Avoid_: Queue, inbox

## Views

**Day view**:
The home page: a strip of days on top and the selected day's tables and bookings below.
_Avoid_: Calendar, grid, availability page

**Day strip**:
The week-at-a-time row of dates above the day view.
_Avoid_: Date picker, calendar bar

**Archive**:
The admin-only list of bookings before today.
_Avoid_: History, log
