# Warband

Single-club table booking app (v1 rewrite). Start every session by reading
[`docs/STATUS.md`](docs/STATUS.md): current slice, next step, loose ends, and
how to work a slice. Update it before ending a session that changed state.

Specs: `docs/PRODUCT.md` (what), `docs/DOMAIN.md` (schema, rules),
`docs/ARCHITECTURE.md` (how), `docs/PLAN.md` (slices), `GLOSSARY.md` (terms —
use them in code and UI).

## Ending a task

End every task's final message with **Steps to check**: a numbered list the
user follows to see the work for themselves. Each step names exactly what to
open or run (URL, page, command, role to sign in as) and the result to
expect. Put anything you couldn't verify yourself first.
