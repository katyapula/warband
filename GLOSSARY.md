# Warband

Warband is the booking app for a single wargaming club: members reserve gaming tables, admins approve bookings and run the club's schedule.

## People

**Visitor**:
Someone using the app without signing in. Can see availability but not who booked.
_Avoid_: Guest, anonymous user

**Member**:
Anyone signed in, admins included.
_Avoid_: User, customer, player

**Admin**:
A member who can review and edit bookings and manage tables and club settings.
_Avoid_: Owner, moderator, staff

## Club

**Club**:
The single wargaming club the app serves.
_Avoid_: Venue, location, store

**Opening hours**:
The open and close time the club keeps on each weekday; a weekday may be closed. The club always closes by midnight.
_Avoid_: Schedule, working hours

**Closed date**:
A specific calendar date on which the club is closed regardless of opening hours.
_Avoid_: Holiday, day off, blackout

**Table**:
A physical gaming table that members can book.
_Avoid_: Board, slot, spot

**Inactive table**:
A table withdrawn from booking that keeps its booking history.
_Avoid_: Deleted table, archived table

## Bookings

**Booking**:
A reservation of one table for a time range on a single date, made either by a member for themselves or by an admin as a walk-in booking.
_Avoid_: Reservation, order, slot

**Walk-in**:
A person without an account whom an admin books a table for, identified only by the name the admin types.
_Avoid_: Guest, non-member, customer

**Walk-in booking**:
A booking an admin creates for a walk-in; it belongs to no member and is approved from the start.
_Avoid_: Manual booking, phone booking, admin booking

**Whole-day booking**:
A booking spanning the club's opening hours on that date.
_Avoid_: Full-day, all-day

**Time-range booking**:
A booking with a start and end time chosen by the member.
_Avoid_: Partial booking, slot booking

**Booking window**:
How far ahead a booking may start.
_Avoid_: Horizon, lead time

**Pending**:
A booking awaiting an admin's decision.

**Approved**:
A booking an admin has accepted.
_Avoid_: Confirmed, accepted

**Rejected**:
A pending booking an admin declined.
_Avoid_: Denied, declined

**Cancelled**:
A booking withdrawn by its member or an admin before it took place.
_Avoid_: Deleted, removed

**Expired**:
A pending booking whose start time passed without an admin decision.
_Avoid_: Stale, timed out

**Completed**:
An approved booking whose end time has passed.
_Avoid_: Finished, done, past booking

**Blocking booking**:
An approved booking, or a pending one that hasn't expired; it prevents overlapping bookings on the same table.
