# Boma — Geo-coordinates & Map Integration Plan

Frontend (and supporting backend) implementation plan for the **Map View** screen and
all location features. Read alongside `blueprint.md` (routes/architecture) and
`BOMA_EDITORIAL_DESIGN.md` (visual system). The Stitch design for this screen lives in
the "Boma" project (Map View screen) — this doc covers turning that design into working code.

Status: **plan only — no frontend code written yet.** Backend geo schema already exists.

---

## 0. Decision: mapping library

**Chosen: Leaflet + OpenStreetMap tiles, via `react-leaflet`.**

| Option | Cost | Verdict |
| --- | --- | --- |
| **Leaflet + OSM** (`react-leaflet` + `leaflet`) | **Free**, no API key, no billing account | ✅ **Chosen** |
| Google Maps (`@vis.gl/react-google-maps`) | Free tier then billing; requires a billing-enabled GCP key | Defer — richer Places data, but billing risk for a portfolio app |
| Mapbox GL (`react-map-gl`) | Free tier (50k loads/mo) then token billing | Alternative if we later want vector tiles / nicer styling |

**Why Leaflet/OSM:** zero cost and zero billing setup (right for a portfolio + student
audience), mature React bindings, trivially themeable to the editorial look, and good
enough for "pins on a town map with a synced list." We are not using turn-by-turn,
Street View, or heavy Places search, so Google buys us little here.

**Swap path (keep it cheap to change):** all map rendering is isolated behind a single
`<ListingMap>` component and a `useMapListings` hook. The rest of the app only knows about
listings + `[lng, lat]`. Switching to Google/Mapbox later = reimplement `<ListingMap>` and
`<PriceMarker>` only; data layer, list pane, filters, and API are untouched.

**Tiles & attribution:** default OSM raster tiles
(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). The OSM attribution control is
**mandatory** — keep "© OpenStreetMap contributors" visible. For a more on-brand look later,
swap the tile URL to a free editorial-friendly provider (e.g. Stadia/Stamen "toner-lite" or
CARTO "positron"), styling only — no code-structure change.

---

## 1. Data model (backend) — mostly already done

`Listing`, `Building`, and `Campus` already store GeoJSON and have geospatial indexes:

```js
location: {
  type:   { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0, 0] }   // [longitude, latitude]
}
// SchemaName.index({ location: "2dsphere" })
```

> ⚠️ **Order is `[longitude, latitude]`** (GeoJSON), the opposite of Leaflet's
> `L.latLng(lat, lng)`. Every boundary between API and map must convert. See §6.

**Outstanding backend gaps to close:**

1. **`[0, 0]` is the null island.** Listings created without real coordinates currently
   default to `[0,0]` (off the coast of Africa). Treat `[0,0]` as "ungeocoded" and exclude
   it from map results (filter `coordinates.0 != 0 OR coordinates.1 != 0`). Long term, make
   coordinates required for a listing to appear on the map.
2. **No geocoding on create.** `createListing` passes `location` straight from the request
   body. We need to populate it (see §2).
3. **No bounds/near query.** `getAllListings` has no geo filter. Add the endpoints in §3.

---

## 2. Geocoding strategy (address → coordinates)

A listing needs real `[lng, lat]` before it can appear on the map. Three layers, in order of
preference:

1. **Manual pin-drop (primary, most reliable).** In the Create/Edit Listing form, embed a
   small Leaflet map with a draggable marker. The landlord drops the pin on their building;
   we store the marker's `[lng, lat]`. No external service, no rate limits, most accurate for
   informal Kenyan addresses that geocoders handle poorly.
2. **Forward geocoding as a convenience.** A "find on map" button that geocodes the typed
   address to pre-position the pin, which the user then fine-tunes. Use **Nominatim**
   (OSM, free) for dev: `https://nominatim.openstreetmap.org/search?format=json&q=...`.
   - Respect Nominatim usage policy: max 1 req/sec, set a `User-Agent`/`Referer`,
     **never bulk-geocode client-side.** Do it server-side, debounced, cached.
   - Bias results to Kenya (`countrycodes=ke`) and toward the listing's campus
     (`viewbox` around the campus coordinates + `bounded=1`).
3. **Inherit from building/campus (fallback).** Listings belong to a `Building` (which has
   its own `location`) anchored to a `Campus`. If a listing has no coordinates, fall back to
   its building's location, then the campus location, so it still appears roughly correctly.

**Seeding:** the existing seed scripts should set realistic `[lng, lat]` clustered around each
campus so the Map View has data to show in dev.

---

## 3. Backend API additions

Add geo-aware read endpoints (the map fetches by viewport, not by page number):

### 3a. Listings within map bounds (primary map fetch)
```
GET /api/listings/within?swLng=&swLat=&neLng=&neLat=&price_min=&price_max=&roomType=&verified=
```
- Query with `$geoWithin` + `$box`:
  ```js
  Listing.find({
    location: { $geoWithin: { $box: [[swLng, swLat], [neLng, neLat]] } },
    "location.coordinates": { $ne: [0, 0] },
    ...filters
  }).populate("building", "name address average_rating").limit(300)
  ```
- Returns a **lightweight** shape for markers (id, title, price, coords, thumbnail,
  isVerified, roomType, area label) — not the full document. Cap results (e.g. 300) so dense
  areas don't ship megabytes; rely on clustering for the rest.

### 3b. Listings near a point (campus-centric default)
```
GET /api/listings/near?lng=&lat=&radius=2000   # metres
```
- Uses `$near` / `$geoNear` against the `2dsphere` index. Powers "homes near X University"
  and the default Map View load (center on a campus).

### 3c. Wire `location` into create/update
- Validate `location.coordinates` is a real 2-number `[lng, lat]` pair (reject `[0,0]`).
- Optionally run the §2 server-side geocode when coordinates are absent but an address is
  present.

> Keep the existing paginated `GET /api/listings` for the List view; the map uses the new
> bounds endpoint. Both share the same filter parsing — factor filters into a helper so
> List and Map stay consistent.

---

## 4. Frontend dependencies

```bash
cd client
pnpm add leaflet react-leaflet
pnpm add react-leaflet-cluster      # marker clustering for dense areas
# leaflet ships its own CSS — import "leaflet/dist/leaflet.css" once (e.g. in main.jsx)
```
- React 19 + Vite 7 are compatible with current `react-leaflet` (v4+). Verify the peer-dep
  matrix at install time and pin versions.
- **Marker icon gotcha:** Leaflet's default marker images break under Vite bundling. We use
  custom HTML/`divIcon` price pills anyway (see §5 `PriceMarker`), which sidesteps it. If any
  default `L.Icon` is used, fix the asset paths explicitly.

---

## 5. Frontend architecture

Route (per `blueprint.md`, public — no auth): **`/map`** (and keep `/` = List Browse).
A `List / Map` segmented toggle switches between them, preserving active filters in the URL
query string so the two views stay in sync and are shareable/linkable.

### Component tree (under `client/src`)
```
Pages/
  MapView.jsx                 # page shell: filter bar + split pane; owns shared selection state
components/map/
  MapFilterBar.jsx            # search + price/type/distance filters + List|Map toggle + result count
  ListingListPane.jsx         # left 40%: scrollable list of cards (reuses ListingCard)
  ListingMap.jsx              # right 60%: <MapContainer>, tiles, markers, bounds tracking
  PriceMarker.jsx             # divIcon price pill ("8.5K"); active/selected variant
  MapPreviewPopup.jsx         # floating mini-card over selected pin (thumb, title, price, link)
  SearchThisAreaButton.jsx    # re-query listings for current viewport
  useMapListings.js (hook)    # fetch-by-bounds, debounce, loading/error, returns listings
components/
  ListingCard.jsx             # shared between List Browse and the map list pane
```

### State & sync (the core interaction)
The list pane and the map share two pieces of state, owned by `MapView.jsx` (plain
`useState` + props/context — no Redux needed at this scale):

- `hoveredListingId` — hovering a card highlights its pin; hovering a pin highlights its card.
- `selectedListingId` — clicking a pin opens `MapPreviewPopup` and scrolls the matching card
  into view (`ref.scrollIntoView({ behavior: "smooth", block: "nearest" })`); clicking a card
  pans/zooms the map to its pin.

Data flow:
```
MapView (filters from URL, hovered/selected state)
   ├─ MapFilterBar  ──(updates URL query)──► filters
   ├─ ListingMap
   │     └─ on moveend → bounds → useMapListings(bounds, filters) → markers
   └─ ListingListPane ◄── same listings array (single source of truth)
```
Both panes render from **one** `listings` array returned by `useMapListings`, so the list and
the pins can never disagree.

---

## 6. The `[lng, lat]` ↔ `[lat, lng]` rule (write this down once)

- **MongoDB / API:** GeoJSON `coordinates: [longitude, latitude]`.
- **Leaflet:** `[latitude, longitude]` (e.g. `<Marker position={[lat, lng]}>`,
  `map.getBounds()` returns lat/lng).
- Centralize conversion in tiny helpers so it's done in exactly one place:
  ```js
  export const toLeaflet  = ([lng, lat]) => [lat, lng];   // GeoJSON → Leaflet
  export const toGeoJSON  = ({ lat, lng }) => [lng, lat]; // Leaflet → GeoJSON
  ```
- When sending bounds to `/listings/within`, read `map.getBounds()` →
  `getSouthWest()/getNorthEast()` and emit them as `lng,lat`.

---

## 7. Performance (per Vercel React best practices)

- **Fetch by viewport, debounced.** Query `/listings/within` on Leaflet's `moveend` event,
  debounced ~300–400ms, so panning doesn't spam the API. Optionally gate behind the explicit
  "Search this area" button to avoid auto-refetch on every nudge.
- **Cluster dense markers** with `react-leaflet-cluster` so hundreds of pins near a campus
  collapse into counts and the DOM stays small.
- **Cap + lazy bodies.** Bounds endpoint returns lightweight marker objects and a result cap;
  full listing details are fetched only on click/navigation.
- **Memoize** marker rendering (`useMemo` over the listings array) and stabilize callbacks
  (`useCallback`) so map re-renders don't rebuild every pin. Key markers by listing `_id`.
- **Code-split the map.** Lazy-load `ListingMap` (and Leaflet) with `React.lazy` / dynamic
  import so the `leaflet` bundle isn't in the main chunk for users who never open the map.
- Import `leaflet.css` once globally; don't re-import per component.

---

## 8. Mobile / responsive (per design system breakpoints)

- **< 768px:** map goes **full-screen**; the listing list becomes a **draggable bottom
  sheet** (peek showing 1–2 cards, expandable to a full list). The `List | Map` toggle stays
  in the filter bar. Selecting a pin raises the sheet to that card.
- **768–1024px:** narrower split (e.g. 45/55) or stacked map-over-list, per the editorial
  reflow rules.
- **≥ 1024px:** the full 40/60 split from the Stitch desktop design.
- Maintain the editorial look on the map chrome: hairline-bordered controls, monospaced
  eyebrow labels, honey accent only on the active/selected pin and the primary CTA.

---

## 9. Build phases (checklist)

**Phase A — Backend geo API**
- [ ] Add `GET /api/listings/within` (`$geoWithin` + `$box`, lightweight projection, cap).
- [ ] Add `GET /api/listings/near` (`$near`, radius) for campus-centric default.
- [ ] Exclude `[0,0]` from map results; share filter parsing with `getAllListings`.
- [ ] Wire `location` validation into create/update; seed realistic campus-clustered coords.

**Phase B — Map View shell (desktop)**
- [ ] Install `leaflet` / `react-leaflet` / `react-leaflet-cluster`; import Leaflet CSS.
- [ ] Build `MapView.jsx` split layout + `MapFilterBar` with `List | Map` URL-synced toggle.
- [ ] `ListingMap` with OSM tiles, attribution, zoom control, bounds tracking on `moveend`.
- [ ] `useMapListings` hook: debounced fetch-by-bounds, loading/error states.

**Phase C — Markers & sync**
- [ ] `PriceMarker` divIcon price pills (default + active states).
- [ ] `MapPreviewPopup` floating mini-card with "View details" → `/listings/:id`.
- [ ] `ListingListPane` reusing `ListingCard`; wire `hovered`/`selected` two-way sync + scroll-into-view.
- [ ] Marker clustering for dense areas.

**Phase D — Create/Edit pin-drop**
- [ ] Draggable-marker mini-map in the listing form; store `[lng, lat]`.
- [ ] Optional server-side Nominatim forward-geocode ("find on map" prefill).

**Phase E — Mobile + polish**
- [ ] Full-screen map + draggable bottom sheet under 768px.
- [ ] On-brand tile styling / pin design pass; performance pass (memoize, code-split, cap).

---

## 10. Open questions / later
- On-brand basemap: stay on default OSM, or move to a styled free provider (CARTO positron /
  Stamen toner-lite) for the editorial cream/forest feel? (styling-only, decide during Phase E)
- "Search as I move the map" auto-refetch vs explicit "Search this area" button — default to
  the explicit button to save requests; revisit after testing.
- If we later need rich Places/autocomplete or Street View, that's the trigger to revisit the
  Google Maps option (and accept billing setup).
