# Club days are activated one by one; schedule changes flag bookings instead of moving them

The club has no fixed weekly schedule, so instead of weekly opening hours plus closed dates, every date is inactive until an admin activates it and sets its working hours (prefilled from defaults in settings). A day is a `ClubDay` row; deactivating keeps the row and its hours. Changing hours or deactivating a day never touches bookings: affected bookings are flagged at read time (*On inactive day*, *Outside working hours*) and admins resolve them by hand. A whole-day booking is stored as the full date (00:00–24:00 local), not as the day's hours, so it can never fall out of sync with them.

## Considered options

- **Weekly hours + closed dates** (previous draft) — rejected: the club opens irregularly, so admins would spend more time adding exceptions than the schedule saves.
- **Block hours changes while bookings are in the way** — rejected: real life (the club has to close) must win; the admin needs to see the conflict, not be stopped by it.

## Consequences

- Nothing is bookable until an admin activates days; "first active day" is the default landing day for members and visitors.
- Flags are derived like Expired/Completed (ADR 0001) — keep them in the same read-time helper.
- Bulk activation (e.g. "every Saturday in December") is a likely follow-up.
