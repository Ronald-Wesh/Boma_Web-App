# Reviews Page — Design Spec

**Date:** 2026-06-30
**Status:** Approved (pending spec review)
**Feature:** Killer feature #2 — verified building reviews from real residents.

## Goal

A flagship `/reviews` page that browses verified building reviews, matching the
editorial directory pattern of `Browse.jsx` / `Roommates.jsx`. Read/browse only;
review creation stays in the existing listing/building flow.

## Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/reviews` | `Reviews.jsx` | Building directory ranked by rating + recent reviews feed |
| `/reviews/:buildingId` | `BuildingReviews.jsx` | One building's full reviews + category breakdown |

Both live inside `SiteLayout` in `App.jsx`, replacing the current `ComingSoon`
catch-all for `/reviews`.

## Data flow

### Directory page (`/reviews`)
- **Single call:** `reviewAPI.getAllReviews()` → `GET /reviews` (already exists),
  returns every review populated with `reviewer` and `building`.
- Page derives both sections client-side:
  - **Building directory:** group reviews by `building._id`, rank by
    `building.average_rating` desc, with review count. Only buildings that have
    reviews appear (correct for a reviews directory).
  - **Recent feed:** flat review list sorted by `createdAt` desc.
- **Backend tweak:** `getAllReviews` currently populates `building` with
  `"name address"` only. Widen to
  `"name address average_rating total_reviews categoryRatings"` so building cards
  can render ratings without a second endpoint.

### Building reviews page (`/reviews/:buildingId`)
- **Single call:** `reviewAPI.getBuildingReviews(buildingId)` →
  `GET /buildings/:buildingId/reviews`.
- **Backend tweak:** that endpoint currently returns `{ reviews, pagination }`.
  Widen it to also return the `building` doc (`Building.findById`), since
  `CommunityFeedback` needs `building.average_rating` and
  `building.categoryRatings` to render the summary + category bars. Response
  becomes `{ building, reviews, pagination }`.

## Components

- **`Reviews.jsx`** — orchestrates fetch, loading skeleton, empty/error states,
  and the two sections. Mirrors `Roommates.jsx` structure; reuses the
  `SectionLabel` eyebrow + skeleton idiom.
- **`components/reviews/BuildingReviewCard.jsx`** — building card: name, address,
  large average + filled stars, review count, "verified residents" eyebrow.
  Links to `/reviews/:buildingId`. Visual language matches `BrowseCard` /
  `RoommateCard` (hairline grid, lowercase headlines, `material-symbols` stars).
- **`components/reviews/RecentReviewCard.jsx`** — one feed row: author
  (`anonymous resident` when `isAnonymous`), building name, title, comment,
  star rating via `categoryAverage`. Reuses `categoryAverage` / `monthYear`
  from `Utils/listingHelpers`.
- **`BuildingReviews.jsx`** — fetches the building + reviews, renders the
  existing **`CommunityFeedback`** component (zero new review-rendering code) plus
  a back link to `/reviews`.

## States

- **Loading:** skeleton cards (same idiom as Roommates `SKELETON_COUNT`).
- **Empty (no reviews at all):** editorial "no reviews yet" empty state.
- **Error:** `toast.error(...)` via `sonner` + empty state fallback.
- **Building not found / no reviews:** `CommunityFeedback` already renders a
  "be the first to review" empty state; the page shows a back link.

## Reuse summary

| Reused | From |
| --- | --- |
| `CommunityFeedback` (summary + category bars + review list) | `components/listings/` |
| `categoryAverage`, `monthYear` | `Utils/listingHelpers` |
| `SectionLabel`, skeleton/empty idiom | `Pages/Roommates.jsx` |
| `reviewAPI.getAllReviews` *(add helper)*, `getBuildingReviews` | `Utils/api.js` |
| Editorial design tokens (`font-*`, hairline, `material-symbols` stars) | existing pages |

> Note: `reviewAPI` has no `getAllReviews` helper yet — add
> `getAllReviews: () => API.get("/reviews")`.

## Out of scope (YAGNI)

- Writing/editing/deleting reviews on this page (stays in listing flow).
- Filtering/sorting controls, pagination UI, campus filters.
- `markHelpful` interaction.

## Verification

- `vite build` (client) to confirm compilation — per the per-page build-only rule.
- Backend tweaks are additive; spot-check `GET /reviews` and
  `GET /buildings/:id/reviews` shapes.
- Hand off to Ronald for the manual click-through.
