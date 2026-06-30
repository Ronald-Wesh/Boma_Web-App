# Reviews Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browse-only `/reviews` building-reviews directory plus a `/reviews/:buildingId` detail page, surfacing killer feature #2 (verified building reviews from real residents).

**Architecture:** A directory page derives a ranked building grid + a recent-reviews feed from a single `GET /reviews` call. A detail page reuses the existing `CommunityFeedback` component from one `GET /buildings/:id/reviews` call. Two small additive backend tweaks widen existing populate/response shapes so no new endpoints are needed.

**Tech Stack:** React + React Router + Tailwind (editorial design tokens), axios via `Utils/api.js`, `sonner` toasts, Express + Mongoose backend.

## Global Constraints

- **No new dependencies** without asking — this plan adds none.
- **Verification is build-only** per Ronald's per-page rule: gate each frontend task with `cd client && npm run build` (runs `vite build`); Ronald does the manual click-through. No unit-test framework exists in the client and none is added.
- **Design idiom (copy verbatim from existing pages):** lowercase headlines (`font-display-hero`, `font-headline-section`), eyebrow labels (`font-label-eyebrow text-label-eyebrow ... uppercase`), hairline grids (`grid ... gap-px bg-hairline border border-hairline`), stars via `material-symbols-outlined` with `fontVariationSettings: "'FILL' 1/0"`, color tokens `text-primary`, `text-slate-muted`, `bg-surface`, `bg-surface-bone`, `bg-surface-container`, `text-secondary-container`, `border-hairline`.
- Reviews are per-building; only buildings that have reviews appear in the directory.

---

### Task 1: Backend response shapes + API helper

Widen two existing controller responses so the frontend gets ratings and the building doc without new endpoints, and add the missing `getAllReviews` client helper.

**Files:**
- Modify: `server/Controllers/reviewController.js` (`getAllReviews`, `getBuildingReviews`)
- Modify: `client/src/Utils/api.js` (`reviewAPI`)

**Interfaces:**
- Produces: `GET /reviews` → array of reviews; each `review.building` now includes `{ _id, name, address, average_rating, total_reviews, categoryRatings }` and `review.reviewer` includes `{ name, verificationStatus }`.
- Produces: `GET /buildings/:buildingId/reviews` → `{ building, reviews, pagination }` where `building` is the full Building doc.
- Produces: `reviewAPI.getAllReviews()` → `API.get("/reviews")`.

- [ ] **Step 1: Widen the `getAllReviews` building populate**

In `server/Controllers/reviewController.js`, find the `getAllReviews` function and change the building populate line:

```js
// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("reviewer", "name verificationStatus")
      .populate(
        "building",
        "name address average_rating total_reviews categoryRatings",
      )
      .sort("-createdAt");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
```

(The only changes vs. the original: the wider `building` field list, and an added `.sort("-createdAt")` so the recent feed is newest-first by default.)

- [ ] **Step 2: Return the building doc from `getBuildingReviews`**

In the same file, update `getBuildingReviews` to also fetch and return the building:

```js
//Get reviews for a building
exports.getBuildingReviews = async (req, res) => {
  try {
    const { sort = "-createdAt", limit = 20, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { building: req.params.buildingId };

    const building = await Building.findById(req.params.buildingId);

    const reviews = await Review.find(filter)
      .populate("reviewer", "name verificationStatus")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(filter);

    res.status(200).json({
      building,
      reviews,
      pagination: {
        total: totalReviews,
        page: pageNum,
        pages: Math.ceil(totalReviews / limitNum),
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
```

(`Building` is already required at the top of the file.)

- [ ] **Step 3: Add the `getAllReviews` client helper**

In `client/src/Utils/api.js`, add one line to the `reviewAPI` object (the active, non-commented one near the top):

```js
//Review API endpoints
export const reviewAPI = {
  createReview: (id, reviewData) =>
    API.post(`buildings/${id}/reviews`, reviewData),
  getAllReviews: () => API.get("/reviews"),
  getBuildingReviews: (id) => API.get(`buildings/${id}/reviews`),
  updateReview: (id, reviewData) => API.put(`reviews/${id}`, reviewData),
  deleteReview: (id) => API.delete(`reviews/${id}`),
  markHelpful: (id) => API.patch(`reviews/${id}/helpful`),
};
```

- [ ] **Step 4: Verify the client still builds**

Run: `cd client && npm run build`
Expected: build completes with no errors (the api change is syntax-only).

- [ ] **Step 5: Commit**

```bash
git add server/Controllers/reviewController.js client/src/Utils/api.js
git commit -m "feat(reviews): widen review API responses for reviews directory"
```

---

### Task 2: Reviews directory page (`/reviews`)

Build the directory page with a ranked building grid and a recent-reviews feed, plus its two card components and a shared `Stars`. Wire the route.

**Files:**
- Create: `client/src/components/reviews/Stars.jsx`
- Create: `client/src/components/reviews/BuildingReviewCard.jsx`
- Create: `client/src/components/reviews/RecentReviewCard.jsx`
- Create: `client/src/Pages/Reviews.jsx`
- Modify: `client/src/App.jsx` (import + route)

**Interfaces:**
- Consumes: `reviewAPI.getAllReviews` (Task 1); `categoryAverage`, `monthYear` from `Utils/listingHelpers`.
- Produces: default-exported `Stars` (`{ value, className }`), `BuildingReviewCard` (`{ building, reviewCount }`), `RecentReviewCard` (`{ review }`), and `Reviews` page.

- [ ] **Step 1: Create the shared `Stars` component**

`client/src/components/reviews/Stars.jsx`:

```jsx
// Five material-symbol stars, filled up to the rounded value.
export default function Stars({ value = 0, className = "" }) {
  const rounded = Math.round(value);
  return (
    <div className={`flex text-secondary-container ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="material-symbols-outlined"
          style={{ fontVariationSettings: `'FILL' ${index < rounded ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `BuildingReviewCard`**

`client/src/components/reviews/BuildingReviewCard.jsx`:

```jsx
import { Link } from "react-router-dom";
import Stars from "./Stars";

// One building tile in the reviews directory grid.
export default function BuildingReviewCard({ building, reviewCount }) {
  const average = building?.average_rating || 0;
  return (
    <Link
      to={`/reviews/${building._id}`}
      className="group bg-surface p-stack-lg flex flex-col gap-stack-md hover:bg-surface-bone transition-colors"
    >
      <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
        verified residents
      </span>

      <div>
        <h3 className="font-headline-section text-[22px] text-primary lowercase group-hover:underline">
          {building?.name || "building"}
        </h3>
        {building?.address && (
          <p className="font-body-main text-sm text-slate-muted mt-1">
            {building.address}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-stack-md">
        <div className="flex flex-col">
          <span className="text-[40px] font-display-hero text-secondary-container leading-none">
            {average.toFixed(1)}
          </span>
          <div className="mt-1 scale-75 origin-left">
            <Stars value={average} />
          </div>
        </div>
        <span className="font-label-eyebrow text-[10px] text-slate-muted uppercase whitespace-nowrap">
          {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `RecentReviewCard`**

`client/src/components/reviews/RecentReviewCard.jsx`:

```jsx
import { Link } from "react-router-dom";
import Stars from "./Stars";
import { categoryAverage, monthYear } from "../../Utils/listingHelpers";

// One row in the recent-reviews feed.
export default function RecentReviewCard({ review }) {
  const rating = categoryAverage(review.categories);
  const author = review.isAnonymous
    ? "anonymous resident"
    : review.reviewer?.name || "resident";
  const building = review.building;

  return (
    <article className="py-stack-lg border-b border-hairline">
      <div className="flex justify-between items-start mb-3 gap-4">
        <div>
          {building?._id ? (
            <Link
              to={`/reviews/${building._id}`}
              className="font-body-strong text-primary lowercase hover:underline"
            >
              {building.name || "building"}
            </Link>
          ) : (
            <p className="font-body-strong text-primary lowercase">building</p>
          )}
          <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
            {author} · {monthYear(review.createdAt)}
          </p>
        </div>
        <div className="scale-75 origin-right">
          <Stars value={rating} />
        </div>
      </div>
      {review.title && (
        <p className="font-body-strong text-primary mb-1">{review.title}</p>
      )}
      {review.comment && (
        <p className="text-slate-muted italic">&ldquo;{review.comment}&rdquo;</p>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Create the `Reviews` page**

`client/src/Pages/Reviews.jsx`:

```jsx
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { reviewAPI } from "../Utils/api";
import BuildingReviewCard from "../components/reviews/BuildingReviewCard";
import RecentReviewCard from "../components/reviews/RecentReviewCard";

const SKELETON_COUNT = 6;
const RECENT_LIMIT = 8;

// Group reviews by building, ranked by average rating desc.
function rankBuildings(reviews) {
  const map = new Map();
  for (const review of reviews) {
    const building = review.building;
    if (!building?._id) continue;
    if (!map.has(building._id)) {
      map.set(building._id, { building, count: 0 });
    }
    map.get(building._id).count += 1;
  }
  return [...map.values()].sort(
    (a, b) => (b.building.average_rating || 0) - (a.building.average_rating || 0),
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reviewAPI.getAllReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load reviews", error);
      toast.error(
        error.response?.data?.message || "Failed to load building reviews",
      );
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildings = rankBuildings(reviews);
  const recent = reviews.slice(0, RECENT_LIMIT);

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
            building reviews
          </span>
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm mb-stack-md">
            real residents. honest ratings.
          </h1>
          <p className="font-body-main text-body-main text-slate-muted max-w-2xl">
            verified reviews on cleanliness, security, water, maintenance and
            landlords — from students who actually lived there.
          </p>
        </div>
      </header>

      {/* Feed */}
      <main className="w-full py-section-gap">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <div key={index} className="bg-surface p-stack-lg">
                  <div className="h-3 w-24 bg-surface-container animate-pulse mb-stack-md" />
                  <div className="h-5 w-40 bg-surface-container animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-surface-container animate-pulse mb-stack-md" />
                  <div className="h-10 w-20 bg-surface-container animate-pulse" />
                </div>
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap min-h-[40vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                reviews
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                no reviews yet
              </h3>
              <p className="font-body-main text-on-surface-variant max-w-sm">
                be the first to review the building you live in.
              </p>
            </div>
          ) : (
            <>
              {/* Ranked building directory */}
              <div className="mb-stack-lg">
                <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
                  top-rated buildings
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline mb-section-gap">
                {buildings.map(({ building, count }) => (
                  <BuildingReviewCard
                    key={building._id}
                    building={building}
                    reviewCount={count}
                  />
                ))}
              </div>

              {/* Recent reviews feed */}
              <div className="mb-stack-lg">
                <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
                  recent reviews
                </span>
              </div>
              <div className="border-t border-hairline max-w-3xl">
                {recent.map((review) => (
                  <RecentReviewCard key={review._id} review={review} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Wire the `/reviews` route**

In `client/src/App.jsx`, add the import alongside the other page imports:

```jsx
import Reviews from "./Pages/Reviews";
```

And add the route inside the `SiteLayout` `<Route element={<SiteLayout />}>` block, after the roommates routes:

```jsx
          <Route path="/reviews" element={<Reviews />} />
```

- [ ] **Step 6: Verify the build**

Run: `cd client && npm run build`
Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/reviews client/src/Pages/Reviews.jsx client/src/App.jsx
git commit -m "feat(reviews): add building reviews directory page"
```

---

### Task 3: Building reviews detail page (`/reviews/:buildingId`)

A detail page that fetches one building's reviews and renders the existing `CommunityFeedback` component, with a back link.

**Files:**
- Create: `client/src/Pages/BuildingReviews.jsx`
- Modify: `client/src/App.jsx` (import + route)

**Interfaces:**
- Consumes: `reviewAPI.getBuildingReviews` (returns `{ building, reviews, pagination }` after Task 1); `CommunityFeedback` from `components/listings/CommunityFeedback` (props `{ building, reviews }`).

- [ ] **Step 1: Create the `BuildingReviews` page**

`client/src/Pages/BuildingReviews.jsx`:

```jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { reviewAPI } from "../Utils/api";
import CommunityFeedback from "../components/listings/CommunityFeedback";

export default function BuildingReviews() {
  const { buildingId } = useParams();
  const [building, setBuilding] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await reviewAPI.getBuildingReviews(buildingId);
      if (!data?.building) {
        setNotFound(true);
        return;
      }
      setBuilding(data.building);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to load building reviews", error);
      toast.error(
        error.response?.data?.message || "Failed to load this building",
      );
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Header */}
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin">
          <Link
            to="/reviews"
            className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase hover:text-primary transition-colors"
          >
            ← all reviews
          </Link>
          <h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-primary lowercase max-w-4xl mt-stack-sm">
            {loading ? "loading…" : building?.name?.toLowerCase() || "building"}
          </h1>
          {building?.address && (
            <p className="font-body-main text-body-main text-slate-muted max-w-2xl mt-stack-sm">
              {building.address}
            </p>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="w-full py-section-gap">
        <div className="max-w-3xl mx-auto px-grid-margin">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 w-32 bg-surface-container animate-pulse" />
              <div className="h-2 w-full bg-surface-container animate-pulse" />
              <div className="h-2 w-full bg-surface-container animate-pulse" />
              <div className="h-2 w-2/3 bg-surface-container animate-pulse" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap min-h-[40vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                domain_disabled
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                building not found
              </h3>
              <Link
                to="/reviews"
                className="font-body-main text-secondary-container hover:underline lowercase"
              >
                back to all reviews
              </Link>
            </div>
          ) : (
            <CommunityFeedback building={building} reviews={reviews} />
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Wire the `/reviews/:buildingId` route**

In `client/src/App.jsx`, add the import:

```jsx
import BuildingReviews from "./Pages/BuildingReviews";
```

And add the route immediately after the `/reviews` route:

```jsx
          <Route path="/reviews/:buildingId" element={<BuildingReviews />} />
```

- [ ] **Step 3: Verify the build**

Run: `cd client && npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/Pages/BuildingReviews.jsx client/src/App.jsx
git commit -m "feat(reviews): add per-building reviews detail page"
```

---

## Self-Review

**Spec coverage:**
- `/reviews` directory (ranked buildings + recent feed) → Task 2. ✓
- `/reviews/:buildingId` detail reusing `CommunityFeedback` → Task 3. ✓
- `getAllReviews` populate widening → Task 1 Step 1. ✓
- `getBuildingReviews` returns building doc → Task 1 Step 2. ✓
- `reviewAPI.getAllReviews` helper added → Task 1 Step 3. ✓
- Reuse `categoryAverage`/`monthYear` → Task 2 `RecentReviewCard`. ✓
- Loading / empty / error states → Tasks 2 & 3. ✓
- Browse-only, no write form (YAGNI) → no create/edit code anywhere. ✓
- Routes inside `SiteLayout` → Task 2 Step 5, Task 3 Step 2. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full content. ✓

**Type consistency:** `Stars({ value, className })` used consistently by both cards; `getBuildingReviews` response `{ building, reviews, pagination }` matches `BuildingReviews.jsx` (`data.building`, `data.reviews`); `getAllReviews` returns an array, consumed as `data` array in `Reviews.jsx`; `CommunityFeedback` prop names `building`/`reviews` match its definition. ✓

**Verification adaptation:** Build-only gate per Ronald's rule (no client test framework); noted in Global Constraints. ✓
