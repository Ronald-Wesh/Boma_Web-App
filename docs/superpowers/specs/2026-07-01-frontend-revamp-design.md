# Boma Frontend Revamp — Design + Functionality Polish Pass

Status: **approved, ready for implementation planning.**

This is a proactive polish pass across the whole frontend, not a reaction to a specific
outage or a feature build-out. Core pages (Home, Auth, Browse, Listing Detail, Reviews,
Roommates, Forum, Map View) all exist and are wired to a live backend. The goal is to
tighten design-system consistency and fix functional rough edges page by page, keeping
the current "Boma Editorial" visual language (see `BOMA_EDITORIAL_DESIGN.md`) rather than
replacing it.

## Goal

Every page conforms to the documented Boma Editorial tokens (true cream background, true
honey accent, correct radius scale), no dead/orphaned code ships in the bundle, and each
page's known functional gaps (from the audit below) are closed or explicitly deferred.

## Non-goals

- No new visual direction — palette, type, and layout system stay as documented.
- No new backend features. The listing-enquiry endpoint stays a stub (building it is new
  backend work, not polish, and is explicitly deferred).
- No deep browser/E2E testing per page — `vite build` to confirm compilation, then the
  user does his own manual click-through, per established workflow ([[boma-frontend-workflow]]).

## Audit findings (read-only sweep, 2026-07-01)

**Global token drift** (`client/src/index.css`):
- `--color-background` / `--color-surface: #f6faf6` (cool mint) vs documented cream
  `#faf6f0` — transposed hex, wrong hue on every page.
- `--color-secondary-container: #fea619` vs documented honey `#f59e0b` — drifted accent.
- `--radius-lg: 0.25rem` / `--radius-xl: 0.5rem` vs documented `12px`/`16px` scale.
- The global `@utility rounded-full { border-radius: 0.75rem }` override (added to kill
  pill-shaped buttons/badges) also breaks every *actual* circle: avatars
  (`ui/avatar.tsx`, `RoommateCard.jsx`, `RoommateProfileModal.jsx`), loading spinners
  (`Utils/protectedRoute.jsx`), status dots (`Auth.jsx`) all render as barely-rounded
  squares instead of circles.

**Dead code** (confirmed unrouted/unimported, approved for deletion):
- `Pages/Listing.jsx`, `components/ListingCard.jsx` — orphaned, pre-editorial styling
  (`bg-gray-800/80`, `bg-gradient-to-br from-indigo-100`, hardcoded `shadow-lg`).
- All 8 `components/ui/*.tsx` shadcn primitives (`avatar`, `badge`, `button`, `card`,
  `dialog`, `dropdown-menu`, `input`, `label`, `sonner`, `textarea`) — unused anywhere in
  `Pages/` or `components/`, and reference CSS variables (`--color-primary-foreground`,
  `--color-card`, `--color-muted-foreground`, `--color-border`, `--color-ring`,
  `--color-destructive`) that don't exist in `index.css`'s token set. `badge.tsx` also
  uses `rounded-4xl` (a true pill), which would violate the no-pill rule if ever wired up.

**Functional gaps:**
- `components/home/FeaturedListings.jsx` renders static mock data from `data/homeData.js`
  — never wired to the real `GET /api/listings` endpoint that Browse already calls.
- `components/listings/ListingSidebar.jsx` enquiry button is a stub — no backend
  endpoint exists. **Deferred** (see non-goals).
- `Pages/MapView.jsx` split pane (`<aside>` + `<ListingMap>`) doesn't collapse to a single
  column below 768px, contradicting the documented mobile breakpoint.
- `components/listings/BrowseCard.jsx` hardcodes literal `"VERIFIED"/"PENDING"` uppercase
  strings instead of lowercase text + `uppercase` CSS class (the pattern used elsewhere,
  e.g. `ListingDetail.jsx`). Cosmetic only.

**Confirmed already fixed** (do not re-touch): geo endpoint ObjectId casting bug, Browse
grid gray-thumbnail bug.

## Phase 0 — Global foundation

Fix once, benefits every page for free:
1. Correct `--color-background`/`--color-surface` to `#faf6f0`.
2. Correct `--color-secondary-container` (honey accent) to `#f59e0b`.
3. Correct `--radius-lg`/`--radius-xl` to `12px`/`16px`.
4. Introduce a dedicated circle utility (e.g. `.rounded-circle` or scope the override to
   named button/badge classes instead of all `rounded-full` usage) so avatars, spinners,
   and status dots render as true circles while buttons/badges/cards stay non-pill.
5. Delete `Pages/Listing.jsx`, `components/ListingCard.jsx`, and all 8 unused
   `components/ui/*.tsx` files.

Verify: `vite build` succeeds, spot-check one page visually (colors/radii shifted as
expected, no circle regressions).

## Phase 1 — Home

Wire `FeaturedListings` to real `GET /api/listings` data (e.g. top N by rating or most
recent), replacing the static mock in `data/homeData.js`. Keep the existing card markup/
styling — this is a data-source swap, not a redesign.

## Phase 2 — Browse + Listing Detail

Fix `BrowseCard`'s hardcoded verified/pending label casing to match the
lowercase-text-plus-CSS pattern. Sweep both pages for any other drift caught while in
there (spacing, eyebrow labels, radii) — same page, same phase.

## Phase 3 — Map View

Fix the split-pane layout so it stacks to one column (list above map, or a toggle) at
≤768px, per the documented breakpoint. `MapToggle` behavior (routing between `/listings`
and `/map`) stays as-is — only the in-page responsive layout changes.

## Phase 4 — Roommates + Roommate Profile Editor

Consistency/mobile pass; no specific bugs flagged by the audit, so scope is whatever
surfaces on inspection during this phase.

## Phase 5 — Reviews + Building Reviews

Same: consistency/mobile pass, fix anything found in-phase.

## Phase 6 — Forum

Same: consistency/mobile pass, fix anything found in-phase.

## Phase 7 — Auth

Light consistency check only — this page was already build-verified and user-tested
during initial construction ([[boma-frontend-workflow]]); not expected to need real
changes.

## Process per phase

Apply fixes → `vite build` to confirm compilation → pause for the user's manual
click-through → commit → push to `origin` — then move to the next phase. This mirrors
the cadence already validated while building these pages originally.
