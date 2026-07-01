# Boma Map View — MVP Design (Phases A + B + C)

Status: **approved, ready for implementation planning.**

This is the *scoped MVP* slice of the larger `MAP_INTEGRATION_PLAN.md`. It delivers a
demoable desktop Map View plus the backend geo API that feeds it. It deliberately defers
the landlord pin-drop create/edit form (Phase D), the mobile bottom sheet (Phase E), and
any on-brand tile restyling. Read this alongside `MAP_INTEGRATION_PLAN.md` (full plan),
`blueprint.md` (routes) and `BOMA_EDITORIAL_DESIGN.md` (visual system).

## Goal

A public `/map` page: an editorial split view with a scrollable listing pane on the left
and an interactive Leaflet map on the right. Pins and cards are driven by a single
listings array and stay in two-way sync (hover highlight + click select). A `List | Map`
toggle moves the user between `/listings` (Browse) and `/map`, preserving active filters
in the URL.

## Non-goals (this slice)

- Landlord pin-drop / draggable-marker geocoding in the create/edit form.
- Mobile full-screen map + draggable bottom sheet.
- Server-side Nominatim forward geocoding.
- On-brand basemap restyling (stay on default OSM tiles for now).

## Library decision

Leaflet + OpenStreetMap raster tiles via `react-leaflet` (per the parent plan): free, no
API key, no billing. All map rendering is isolated behind `<ListingMap>` and the
`useMapListings` hook, so a later swap to Google/Mapbox touches only those files. OSM
attribution ("© OpenStreetMap contributors") stays visible — mandatory.

---

## Phase A — Backend geo API (`server/`)

Existing state (verified): `Listing`, `Building`, `Campus` all store GeoJSON
`location: { type:"Point", coordinates:[lng,lat] }` with a `2dsphere` index. Seed data
already assigns realistic coords (buildings jitter around 5 Nairobi-area campuses;
listings inherit their building's location), so the map has data in dev. The paginated
`GET /api/listings` (`getAllListings`) already parses search/status/verified/roomType/
price/amenities/campus filters.

### A1. Extract shared filter parsing
Factor the filter-building logic out of `getAllListings` into a helper
(`buildListingFilter(query)`) so the List view and the two new geo endpoints apply
filters identically. `getAllListings` is refactored to call it; behavior is unchanged.

### A2. `GET /api/listings/within`
```
GET /api/listings/within?swLng&swLat&neLng&neLat&search&roomType&minPrice&maxPrice&verified&amenities&campus
```
- Combines `buildListingFilter(query)` with a geo clause:
  `location: { $geoWithin: { $box: [[swLng,swLat],[neLng,neLat]] } }`.
- Excludes ungeocoded listings: `location.coordinates: { $ne: [0,0] }`.
- Lightweight projection for markers — `_id, title, price, roomType, isVerified,`
  `images` (first only via projection or trimmed in code), `location.coordinates`, and
  populated `building` `name`/`address`. Not the full document.
- `.limit(300)` so dense areas don't ship megabytes; clustering handles the rest.
- Validates the four bounds params are finite numbers; 400 on bad input.

### A3. `GET /api/listings/near`
```
GET /api/listings/near?lng&lat&radius=2000   # radius in metres, plus same filters
```
- `$near` against the `2dsphere` index with `$maxDistance: radius`. Same lightweight
  projection + `[0,0]` exclusion + shared filters. Powers the campus-centric default and
  "homes near X University".

### A4. Routing
Register `/within` and `/near` **before** the `/:id` route in `listingRoutes.js`,
otherwise Express matches them as `getListingById` with `id="within"`. Both are public
(no `protect`), consistent with `GET /api/listings`.

### A5. API client
Add to `client/src/Utils/api.js` `listingAPI`:
`getListingsWithin(params)` → `GET /listings/within`,
`getListingsNear(params)` → `GET /listings/near`.

---

## Phase B — Map View shell (`client/`)

### B1. Dependencies
`pnpm --dir client add leaflet react-leaflet react-leaflet-cluster`. Confirm React 19 /
Vite 7 peer-compat at install and pin versions. Import `leaflet/dist/leaflet.css` once in
`main.jsx`. **No dependencies beyond these three without asking.**

### B2. Route + navigation
- Add `<Route path="/map" element={<MapView />} />` inside `SiteLayout` in `App.jsx`.
- A `List | Map` segmented toggle appears on both Browse and MapView, linking `/listings`
  ↔ `/map` and carrying the current filter query string so the views stay in sync and are
  shareable.

### B3. `useMapListings` hook (`client/src/hooks/useMapListings.js`)
- Input: bounds (`{swLng,swLat,neLng,neLat}`) + filters object.
- Calls `listingAPI.getListingsWithin`, debounced ~350ms; exposes `{ listings, loading,
  error, refetch }`. Single source of truth for both panes.

### B4. Map center / initial load
Center defaults to Nairobi at a zoom that shows the campus cluster. Initial listings load
fires once the map has bounds. Re-fetch is driven by an explicit **"Search this area"**
button (not auto-on-pan) to conserve requests; the button appears after the user moves the
map.

### B5. Lazy-loading
`ListingMap` (and therefore Leaflet) is loaded with `React.lazy` + `Suspense` so the
`leaflet` bundle is excluded from the main chunk for users who never open the map.

---

## Phase C — Markers, list pane, and sync

### Component tree (under `client/src`)
```
Pages/
  MapView.jsx                 # page shell: filter/toggle bar + split pane; owns shared selection state
components/map/
  ListingMap.jsx              # <MapContainer>, OSM tiles + attribution, markers, bounds tracking
  PriceMarker.jsx             # divIcon honey price pill ("8.5K"); default + active variant
  MapListingCard.jsx          # compact card for the list pane (thumb + title + price + verified chip)
  MapPreviewPopup.jsx         # floating mini-card over selected pin → "View details" → /listings/:id
  MapToggle.jsx               # List | Map segmented control (filter-preserving links)
  mapHelpers.js               # toLeaflet / toGeoJSON coord converters + price-pill formatting
```

### C1. `PriceMarker`
`divIcon` honey pill showing an abbreviated price ("8.5K"). Selected/active state uses the
honey accent per the editorial system; default is a subtler hairline-bordered pill.

### C2. `MapListingCard`
A new compact card (small thumbnail + title + price + verified chip), lighter than the
tall `BrowseCard`, suited to a scrollable vertical pane. Clicking it selects the listing.

### C3. Two-way sync (owned by `MapView`)
- `hoveredListingId` — hovering a card highlights its pin and vice-versa.
- `selectedListingId` — clicking a pin opens `MapPreviewPopup` and scrolls the matching
  card into view (`scrollIntoView({ behavior:"smooth", block:"nearest" })`); clicking a
  card pans/zooms the map to its pin.
- Both panes render from the one `listings` array from `useMapListings`, so pins and cards
  can never disagree.

### C4. Clustering
`react-leaflet-cluster` collapses dense campus pins into counts, keeping the DOM small.

### C5. Coordinate rule
GeoJSON/API is `[lng, lat]`; Leaflet is `[lat, lng]`. All conversion goes through
`toLeaflet`/`toGeoJSON` in `mapHelpers.js` — done in exactly one place. Bounds sent to
`/within` are read from `map.getBounds()` (`getSouthWest`/`getNorthEast`) and emitted as
`lng,lat`.

---

## Data flow

```
MapView (filters from URL; hovered/selected state)
   ├─ MapToggle       ──(filter-preserving link)──► /listings ↔ /map
   ├─ ListingMap
   │     └─ moveend → "Search this area" → bounds → useMapListings(bounds, filters) → markers
   └─ list pane (MapListingCard[]) ◄── same listings array (single source of truth)
```

## Error / edge handling

- No listings in view → empty state in the pane ("no rooms in this area"), map still shown.
- Fetch error → toast (matches existing `sonner` usage) + non-blocking error state; keep
  last good results if possible.
- Ungeocoded listings (`[0,0]`) never reach the client (filtered server-side).
- Bad/missing bounds params → 400 from the API; hook surfaces the error state.

## Testing

- Backend: `/within` returns only listings inside the box and excludes `[0,0]`; filters
  (roomType, price, verified) narrow results; bad bounds → 400. `/near` respects radius.
  `/within` and `/near` resolve correctly and are not shadowed by `/:id`.
- Frontend: hook debounces and returns a single array; hover/select sync both directions;
  clicking a pin scrolls the card into view; lng/lat conversion is correct
  (a known campus pin lands in the right place); map chunk is code-split.

## Build order

1. A1 shared filter helper → A2/A3 endpoints → A4 routing → A5 API client (verify with curl/seed data).
2. B1 deps + CSS → B2 route/toggle → B3 hook → B4 initial load → B5 lazy-load.
3. C5 helpers → C1 PriceMarker → C2 MapListingCard → MapPreviewPopup → C3 sync → C4 clustering.
