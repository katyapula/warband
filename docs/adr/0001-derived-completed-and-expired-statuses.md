# Completed and Expired are derived, not stored

Bookings store only four statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. **Completed** (approved, end time passed) and **Expired** (pending, start time passed) are computed from the current time whenever bookings are read. We host on Vercel with no long-running worker, and a scheduled job that flips statuses could lag or fail, leaving bookings in a wrong state. Deriving them means they are always correct and need no infrastructure.

## Consequences

- Queries that filter by status (e.g. "blocking bookings", "admin pending queue") must also compare against the current time; keep this in one helper, not scattered `WHERE` clauses.
- Don't "fix" this by adding `COMPLETED`/`EXPIRED` to the enum without revisiting this decision.
