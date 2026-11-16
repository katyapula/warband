# Warband — Design Plan

Goal: stop looking like a stock Ant Design app. Warband should feel like a
wargaming club's own place: warm, a bit rugged, easy to read on a phone at
the table. Tagline to carry through: **Play casual, dice hard.**

Non-goals: no redesign of flows or features; no new UI library (stay on
antd, theme it). Anti-goal: "fantasy" kitsch that hurts legibility
(parchment textures under text, blackletter body fonts).

## Done

- **Mark.** `public/brand/mark.svg`: the club's horned helmet redrawn as
  a clean vector (ink `#1f1a17`, rivets cut out). The header shows it at
  40px with a WARBAND wordmark instead of the shrunk 640px badge.
- **App icon.** `src/app/icon.svg`: cream helmet on a brick tile. Replaces
  the old `favicon.ico` / `favicon.svg`. `public/logo.jpg` (full badge
  with tagline) is kept for print/social use and is no longer referenced.
- **Step 1, theme pass.** Tokens in `src/shared/ui/theme.ts` (antd theme +
  `brand` colors + `fonts`), Inter/Oswald loaded in `src/app/layout.tsx`,
  headings and card/modal titles in Oswald via `src/app/globals.css`. All
  hard-coded colors and preset tag colors now use `brand`; tags are
  `variant="outlined"` in brand colors. Brass was darkened from `#b8862b`
  to `#8a6219` so its text passes 4.5:1 contrast.
- **Step 2, header bar.** `src/widgets/header/HeaderBar.tsx` (client):
  sticky ink bar, cream `Mark` (`src/shared/ui/Mark.tsx`, inline SVG in
  `currentColor`) + Oswald wordmark, links with an underline on the
  current page (`#e07a62`, a lighter brick that keeps 3:1 on ink),
  "Needs attention" as a brass pill. Below 720px the links and account
  move into a right-hand drawer behind a menu button; the attention pill
  stays in the bar showing only the count. Layout lives in `globals.css`
  (`.wb-*`) so there's no flash from JS breakpoints.
- **Step 3, day strip.** Styles moved from inline to `.wb-strip` /
  `.wb-day` classes in `globals.css` (hover and focus need CSS). Open days
  are raised paper cards; closed days sit flat with muted text (still
  4.6:1). Today keeps a brick ring, the selected day is filled brick with
  a soft shadow, the pending badge sits on the card corner. Pill "Today"
  button, uppercase Oswald month label, 36px arrows. Cells are 64px tall.
- **Step 4, table timeline.** `TableTimeline.tsx` draws each table's open
  hours as a 12px bar with hour ticks (every 2h past 8h); geometry is in
  `timeline.ts` (tested). Fills: approved = solid brick, pending = brass
  stripes, someone else's = light grey block with a grey outline (each
  differs by shape or lightness, not just hue); empty track = free. Cancelled/expired bookings and time
  outside the hours aren't drawn. A legend shows when a day has 2+ kinds
  (visitors only ever see grey, so no legend). The bar is `aria-hidden`:
  the booking list under it says the same in text. Hidden on inactive
  days. Hover shows "12:00–16:00 · Pending".
- **Step 5, empty states.** `src/shared/ui/EmptyState.tsx`: faded helmet,
  Oswald headline, a line of text, optional pill link. Used for the
  chilling day (with "Next open day: Sat 21 Nov"), no days open, no
  tables (admins get "Add tables"), and empty My bookings tabs.
- **Step 6, sign-in and About.** `BrandHero` (helmet, name, tagline).
  Sign-in is a centered card; About centers the hero, links the location
  to Google Maps, and puts the description in a 65ch card.
- **Step 7, social card.** `src/app/opengraph-image.png` (1200×630,
  rendered from HTML with the real fonts) + `.alt.txt`. Next adds the
  `og:image` tags. To redo it, render a 1200×630 page and screenshot it.
- **Step 8, dark mode.** Superseded by *Dark only* below.
- **Dark only (2026-11-16).** Light mode and the system-setting switch
  are gone: following the system made antd components flash light before
  hydration, and cookie / client-hint workarounds didn't stop it. The app
  is always dark, so the server renders the final colors. The brown
  (bone/ink) palette was replaced by cool charcoal with the brick, brass
  and moss accents kept (Brand tokens below). Colors are `--wb-*`
  variables in `globals.css`; `palette` + `appTheme` in `theme.ts` are
  the hex twins antd needs. Brand-colored tags use `BrandTag` instead of
  antd `Tag color`.
- **Review fixes.** The timeline's "Booked" segments are outlined so
  they don't rely on hue; each `Mark` has its own mask id (`useId`); the
  phone menu's nav is labelled "Menu" so it doesn't clash with the bar's
  "Main"; `/admin` drops the "Signed in as" line the header already shows.
- **Admin home + bar button.** `/admin` is a grid of brand cards
  (`.wb-admin-*`) instead of a bare list. Sign out on the header bar is
  a plain `.wb-bar-button` in `--wb-on-bar` colors: antd's `ghost`
  button took `colorBgContainer`, near-invisible on the dark-mode bar.

## Brand tokens

One file, `src/shared/ui/theme.ts`, used by `AppShell`'s `ConfigProvider`
and by anything that styles itself.

Dark only. Values live in `src/app/globals.css` (`--wb-*`) and, as hex
for antd, `palette` in `src/shared/ui/theme.ts`.

| Token (`--wb-`) | Value     | Use                                      |
| --------------- | --------- | ---------------------------------------- |
| `primary`       | `#b3362b` | brick: buttons, selected day (white text 6:1) |
| `accent`        | `#ef7a63` | ember: links, underlines, today ring (6:1 on surface) |
| `text`          | `#e6e8ec` | body text (13.5:1 on surface)            |
| `bg`            | `#121418` | charcoal page background                 |
| `surface`       | `#1c1f25` | cards, modals, open days                 |
| `bar`           | `#0b0c0f` | header bar                               |
| `brass`         | `#d9a94f` | pending, attention pill (7.7:1)          |
| `moss`          | `#8fbf73` | approved status (7.8:1)                  |
| `taken`         | `#8a919c` | someone else's booking on the timeline   |

The app icon (`src/app/icon.svg`) and social card still use the old
cream/brick look.

Fonts via `next/font/google`: **Oswald** (600, uppercase) for the
wordmark, page titles, table names and day numbers; **Inter** for body.
antd tokens (`darkAlgorithm`): `colorPrimary`, `colorBgLayout: bg`,
`colorBgContainer: surface`, `colorText: text`, `borderRadius: 8`,
`fontFamily: Inter`.

## Improvements, in order

1. ~~**Theme pass**~~ (done). Add `theme.ts` + fonts, wire into `AppShell`,
   replace `ACCENT` and the stray hex colors (`DayStrip`, `StatusTag`
   colors to brick/brass/moss). Biggest visual change for the least code.
2. ~~**Header bar**~~ (done). Solid `ink` bar, cream mark + Oswald
   wordmark, nav links in bone with a brick underline on the current page.
   "Needs attention (n)" becomes a brass pill instead of bold text. On
   phones, nav collapses to a menu button.
3. ~~**Day strip**~~ (done). Oswald day numbers, brick filled selected day,
   today as a brick ring, active dot stays. Taller tap targets (≥44px).
4. ~~**Table cards → timeline**~~ (done). Each table card gets a thin bar
   from open to close time with booked stretches filled (brick = approved,
   striped brass = pending, grey = someone else's), so free time is
   visible at a glance. The booking list stays below it for details and
   actions. Pure presentation over data the card already has (`bookings`,
   `gaps`, day hours).
5. ~~**Empty and inactive states**~~ (done). The "Warband is chilling today"
   message gets the mark in a muted tone and a link to the next active
   day; "no tables yet" likewise.
6. ~~**Sign-in and About**~~ (done). Sign-in: centered card with the mark,
   wordmark and tagline above the Google button. About: club name in
   Oswald, location with a map link, description in a readable 65ch
   column.
7. ~~**Social card**~~ (done). `src/app/opengraph-image.png` (1200×630, bone
   background, mark, wordmark, tagline) so links shared in chat look like
   the club.
8. ~~**Dark mode**~~ (done, then made the only mode).

Each step is its own PR from `main`; 1 must land first, the rest are
independent.
