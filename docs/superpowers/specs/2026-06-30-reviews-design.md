# Reviews — Design Spec

Date: 2026-06-30
Status: Approved (design), pending implementation plan
Page: Reviews (3rd killer differentiator — verified building reviews)

## Goal

Build the verified-building-reviews experience: a building-scoped reviews page
matching the Stitch "Building Reviews" screen, plus a global index so the
top-nav `reviews` link is functional. Reviews are the trust engine of the
student-first product — the differentiator is the **per-category rating
breakdown** sourced from real residents.

## Routes & Pages

| Route | Page component | Primary data |
|---|---|---|
| `/reviews` | `Pages/ReviewsIndex.jsx` | `GET /api/buildings?reviewed=true` |
| `/buildings/:id/reviews` | `Pages/BuildingReviews.jsx` | `GET /api/buildings/:id` + `GET /api/buildings/:id/reviews` |

- Listing Detail's `CommunityFeedback` gains a **"see all reviews →"** link to
  `/buildings/:buildingId/reviews`.
- Top-nav `reviews` → `/reviews`.
- Both routes render inside the shared `SiteLayout` (editorial header/footer),
  consistent with Home / Browse / Listing Detail.

## Frontend Components

All new components under `client/src/components/reviews/`.

- **`StarRating.jsx`** (shared) — supports a **display** mode (read-only, fills
  to a fractional/rounded value) and an **interactive** mode (click/hover to
  set 1–5). Replaces the inline `Stars` in `CommunityFeedback.jsx`, which will
  be refactored to import this.
- **`ReviewHero.jsx`** — eyebrow `BUILDING REVIEWS`, building name (lowercase
  display), earned "verified building" badge (shown only when
  `building.isVerified` is true — see Data Decisions), location line
  (`address · {haversineKm} to {campus.name}` when campus + valid coords),
  right side: large `average_rating` number + display stars +
  `BASED ON {total_reviews} REVIEWS`.
- **`CategoryStrip.jsx`** — horizontal strip of the 6 real categories
  (cleanliness, maintenance, amenities, security, water_availability,
  landlord_reliability) with label + numeric average, reading from
  `building.categoryRatings`. Reuses a shared `CATEGORY_LABELS` map.
- **`ReviewTabs.jsx`** — `Most Recent` / `Top Rated` / `Verified Stays`.
  Controls the active tab; the page maps the tab to query params and refetches.
- **`ReviewCard.jsx`** — avatar (initials fallback), author name (or
  "anonymous resident" when `isAnonymous`), meta line ("verified stay" when
  `review.verified`, else `verificationStatus`/role if present), display stars
  (computed `categoryAverage`), title, comment. **Helpful** button → real
  `PATCH /reviews/:id/helpful` with optimistic increment, auth-gated. **Reply**
  button → stub `toast.info("Replies are coming soon.")` (no backend yet).
- **`WriteReviewForm.jsx`** — sticky sidebar form:
  - Auth-gated: logged-out users see a "log in to review" prompt linking to
    `/login` instead of the form.
  - **Required overall star** (interactive `StarRating`) + title + comment +
    "post anonymously" checkbox.
  - Expandable **"rate by category"** section (collapsed by default) with a
    `StarRating` per category. On submit, any category left unset falls back to
    the overall star value so all 6 categories get a 1–5 value (the backend +
    category strip stay meaningful).
  - Submits via `POST /api/buildings/:id/reviews`. Handles the
    one-review-per-building `400` with an inline message + toast; on success,
    prepends the new review and refreshes building aggregates (refetch
    building).
- **`ReviewedBuildingCard.jsx`** — index card: building name, average + stars,
  top-rated category, `total_reviews`, links to `/buildings/:id/reviews`.

Shared helpers reused from `client/src/Utils/listingHelpers.js`: `initials`,
`monthYear`, `categoryAverage`, `haversineKm`. The `CATEGORY_LABELS` map (today
duplicated in `CommunityFeedback.jsx`) moves into `listingHelpers.js` (or a
small shared `reviewHelpers.js`) so the strip, card, and form share one source.

## Backend (additive, low-risk)

1. **`GET /api/buildings/:buildingId`** — `buildingController.getBuildingById`.
   Returns the full building doc with `campus` populated
   (`name shortName location`) and a computed `isVerified` boolean derived from
   `Review.exists({ building, verified: true })`. New route in
   `buildingRoutes.js`.

2. **`GET /api/buildings?reviewed=true`** — `buildingController.getBuildings`.
   Lists buildings, optionally filtered to `total_reviews > 0`, `campus`
   populated, sorted by `total_reviews` desc. New route in `buildingRoutes.js`.
   Route ordering: register `/` before `/:buildingId`.

3. **Extend `reviewController.getBuildingReviews`** (the active one mounted via
   `reviewRoutes.js` — the `buildingController` copy is unmounted dead code and
   is left untouched). Add:
   - `verified=true` → adds `{ verified: true }` to the filter.
   - `sort=top_rated` → orders by per-review overall rating (mean of the 6
     category values) descending, via an aggregation `$addFields`/`$avg`.
   - Default and `sort=recent` keep `createdAt` desc.
   - **Response shape `{ reviews, pagination }` is preserved** so the existing
     Listing Detail `CommunityFeedback` consumer keeps working unchanged.
   - `reviewer` is still surfaced with `name` + `verificationStatus` (via
     populate for the find path, or `$lookup` + `$project` for the aggregate
     path).

4. **`client/src/Utils/api.js`**:
   - `buildingAPI.getBuilding(id)` → `GET /buildings/:id`
   - `buildingAPI.getReviewedBuildings()` → `GET /buildings?reviewed=true`
   - `reviewAPI.getBuildingReviews(id, params)` → pass `{ params }` through
     (tab sort/filter + pagination).

No new npm dependencies. `sonner` (toasts) and `react-router-dom` already
present.

## Data Decisions (gaps flagged, handled gracefully)

- **"Verified building" badge** is *earned*: shown only when the building has
  ≥1 review with `verified: true` (computed `isVerified`), not a fabricated
  field. Buildings without verified reviews simply omit the badge.
- **"N students nearby"** in the Stitch location line has **no backing data** →
  dropped. Location line is `address · {distance} to {campus}` (distance and
  campus clause only render when data exists).
- **Review card sub-meta** ("Architecture student · lived here 2 years") has no
  backing data. We only have `reviewer.name`, `reviewer.verificationStatus`,
  and `review.verified`. Cards degrade to a "verified stay" tag (when
  `review.verified`) and nothing invented.
- **Helpful** has no per-user dedup in the backend (can be incremented
  repeatedly). Acceptable for this portfolio happy-path; not adding dedup now.

## States & Error Handling

- **Loading:** skeletons for hero, category strip, and review list
  (consistent with Listing Detail's skeleton pattern).
- **Building not found (404):** friendly centered page with a link back to
  `/reviews` / `/listings`.
- **No reviews:** "be the first to review this building" empty state; category
  strip hidden when no `categoryRatings > 0`.
- **Logged-out write form:** login prompt instead of the form.
- **Duplicate review (400):** inline error + toast; form stays populated.
- **Index empty:** "no reviewed buildings yet" empty state.

## Testing

Per the established Boma frontend workflow (one page at a time, design-first):
build-verify with `pnpm build` to confirm compilation, then **pause and hand
off to Ronald for the manual click-through** (tabs, write-review validation +
submit, helpful toggle, navigation between index ↔ building page ↔ listing
detail). Deeper automated testing only if Ronald requests it for this page.

## Out of Scope (follow-ups)

- Replies to reviews (no model yet) — stubbed.
- Helpful per-user dedup.
- Editing/deleting your own review from the UI (endpoints exist; not wired).
- A full building landing page (only the reviews view is built now).
- Building verification as a first-class admin-set field.
