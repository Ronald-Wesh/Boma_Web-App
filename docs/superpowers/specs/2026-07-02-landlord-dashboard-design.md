# Landlord Dashboard — Design Spec

**Date:** 2026-07-02
**Status:** Approved (pending spec review)
**Feature:** Landlord-facing listing management + a real enquiry system, replacing the dead `/landlord/dashboard` route that currently falls through to `ComingSoon`.

## Goal

Give landlords a working home base: manage the listings they created, and see
real enquiries from tenants. Today `/landlord/dashboard` is a 404-into-ComingSoon
dead link (`Auth.jsx` already redirects landlords there post-login), there is no
listing create/edit UI anywhere in the client, and the "enquire now" form on
`ListingSidebar.jsx` is a front-end stub that never persists anything
(`setTimeout` + toast, per its own `NOTE` comment).

## Routes

| Route | Page | Purpose |
| --- | --- | --- |
| `/landlord/dashboard` | `LandlordDashboard.jsx` | Tabbed: "My Listings" (default) / "Enquiries" |
| `/landlord/listings/new` | `LandlordListingForm.jsx` | Create a listing |
| `/landlord/listings/:id/edit` | `LandlordListingForm.jsx` | Edit a listing (same component, pre-filled) |

All three wrapped in the existing (currently unused) `LandlordRoute` guard from
`client/src/Utils/protectedRoute.jsx`. Tabs on the dashboard are client-side
state, not routes — matches the map/list toggle pattern in `Browse.jsx`.

## Data model

One new collection, `server/Models/Enquiry.js`:

```js
{
  listing:  ObjectId ref Listing, required,
  landlord: ObjectId ref User, required,   // denormalized from listing.createdBy at creation time — cheap landlord-scoped queries with no populate+filter
  tenant:   ObjectId ref User, nullable,   // set from req.user if the sender is logged in, else null — preserves today's anonymous-friendly enquiry UX
  name:     String, required,
  phone:    String, required,
  message:  String, required,              // new field — today's ListingSidebar form has no message box
  status:   enum ["new", "contacted"], default "new",
  timestamps: true,
}
```

No changes to the `Listing` or `User` schemas.

## Backend

- `POST /api/listings/:id/enquiries` — public (no `protect` middleware, matching
  today's anonymous-OK enquiry form). The existing `protect` middleware always
  rejects requests with no Bearer token, so this route needs a new, smaller
  `optionalAuth` middleware in `authMiddleware.js`: if a Bearer token is present
  and valid, set `req.user` (reusing `protect`'s decode logic); if absent or
  invalid, call `next()` anyway instead of returning 401. `createEnquiry` then
  sets `tenant: req.user?._id ?? null`. New controller
  `server/Controllers/enquiryController.js::createEnquiry`, added to
  `listingRoutes.js`.
- New `server/Routes/enquiryRoutes.js`, mounted at `/api/landlord`:
  - `GET /api/landlord/enquiries` — `protect`, scoped to
    `Enquiry.find({ landlord: req.user._id })`, populated with `listing` (title)
    and `tenant` (name, if set).
  - `PATCH /api/landlord/enquiries/:id/status` — `protect` + ownership check
    (`enquiry.landlord.toString() === req.user._id.toString()`), toggles
    `new`/`contacted`.
- **"My Listings" needs no new route.** `buildListingFilter()` in
  `listingController.js` gets one addition: `if (createdBy) filter.createdBy =
  createdBy;`. The dashboard then calls the existing
  `listingAPI.getAllListings({ createdBy: user._id })` — the public search
  endpoint already returns full listing data regardless of verification/status,
  so scoping by `createdBy` needs no new authorization: it is the same data any
  visitor could already reach by browsing.
- Listing create/edit already enforce ownership server-side
  (`createListing` sets `createdBy: req.user._id`; `updateListing` /
  `deleteListing` 403 non-owners) — no change needed there.

## Frontend

- **`client/src/Pages/LandlordDashboard.jsx`** — tab state (`listings` |
  `enquiries`, default `listings`).
  - Listings tab: grid of the landlord's own listings, adapted from
    `BrowseCard.jsx` styling with added edit/delete actions and a verification
    badge (`isVerified`); "+ add listing" CTA → `/landlord/listings/new`.
  - Enquiries tab: list sorted newest-first — sender name/phone/message,
    listing title, status badge, "mark contacted" button.
  - Empty states reuse the existing `EmptyState` component (already used on
    Roommates/Reviews).
- **`client/src/Pages/LandlordListingForm.jsx`** — one component for both create
  and edit (edit pre-fills via `getListingById`). Full `Listing` schema: title,
  description, price, buildingName, address, roomType, bedrooms, bathrooms,
  features, amenities, image URLs (plain URL inputs — no upload infra exists
  anywhere in this codebase; matches how seed data and every other image field
  already works), status, plus the location picker below.
- **`client/src/components/landlord/LocationPicker.jsx`** — small embedded
  Leaflet map (Leaflet is already a dependency, used in `MapView.jsx`);
  click-to-drop-a-pin fills `location.coordinates`. Required because
  `createListing` rejects `[0, 0]`/missing coordinates, and no location-input UI
  exists anywhere today — `MapView.jsx` only displays existing pins.
- **`client/src/Utils/api.js`** — add `enquiryAPI` (`create`, `getMine`,
  `updateStatus`); `listingAPI.getAllListings` already accepts arbitrary
  params, so no new client helper is needed for "my listings."
- **`client/src/components/listings/ListingSidebar.jsx`** — add a `message`
  textarea to the existing enquiry form; replace the fake `setTimeout` in
  `handleEnquire` with a real `enquiryAPI.create(listing._id, { name, phone,
  message })` call.

## States / error handling

- Client-side required-field validation before submit (mirrors `Auth.jsx` /
  `RoommateProfileEditor` inline-error + toast pattern); location must be set
  before the form can submit.
- 403 on update/delete (not the owner) → `toast.error` + redirect to
  `/landlord/dashboard`.
- Loading: skeleton cards, same idiom as `Roommates.jsx`.
- Empty: "no listings yet" / "no enquiries yet."

## Reuse summary

| Reused | From |
| --- | --- |
| `LandlordRoute` guard | `Utils/protectedRoute.jsx` (currently unused) |
| `isLandlord` flag | `context/authContext.jsx` |
| Card visual language | `components/listings/BrowseCard.jsx` |
| `EmptyState`, skeleton idiom | `Pages/Roommates.jsx` |
| Leaflet map | already a dependency, `Pages/MapView.jsx` |
| `listingAPI.getAllListings` (extended with `createdBy` param) | `Utils/api.js` |
| Ownership checks on update/delete | `Controllers/listingController.js` (already correct) |

## Out of scope (YAGNI)

- In-app enquiry reply thread / messaging — one-way form only, landlord follows
  up by phone/email, per explicit decision this round.
- Image upload (file picker, storage) — URL inputs only, matches the rest of
  the app.
- Dashboard stats/analytics (views, conversion, etc.) — no data source exists
  for this yet.
- Admin dashboard — separate spec, next round.
- Legal/support footer pages (`/privacy`, `/terms`, `/rules`, `/support`) —
  parked as a follow-up.

## Verification

- `vite build` (client) to confirm compilation.
- Backend: syntax-check new/changed controller and route files
  (`node --check`).
- Manual checklist (goes in the implementation plan): create/edit/delete a
  listing end-to-end with the location picker; submit an enquiry both logged
  in and anonymous; confirm it appears only in the correct landlord's
  dashboard; mark contacted; confirm a non-owner landlord gets 403/empty when
  trying to see or edit another landlord's listings or enquiries.
