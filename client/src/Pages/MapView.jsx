import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useMapListings from "../hooks/useMapListings";
import ListingMap from "../components/map/ListingMap";
import MapListingCard from "../components/map/MapListingCard";
import MapToggle from "../components/map/MapToggle";
import { hasRealCoords } from "../components/map/mapHelpers";

const ROOM_TYPES = [
  { value: "", label: "Any type" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "single_room", label: "Single Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "One Bedroom" },
  { value: "two_bedroom", label: "Two Bedroom" },
];

const PRICE_BANDS = [
  { value: "", label: "Any price", min: "", max: "" },
  { value: "u8", label: "Under 8k", min: "", max: "8000" },
  { value: "8-15", label: "KSh 8k – 15k", min: "8000", max: "15000" },
  { value: "15-25", label: "KSh 15k – 25k", min: "15000", max: "25000" },
  { value: "25+", label: "25k+", min: "25000", max: "" },
];

// Editorial eyebrow shared by the toolbar columns.
function Field({ label, children }) {
  return (
    <div className="flex flex-col px-4 first:pl-0">
      <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function MapView() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters live in the URL so the view is shareable and the List|Map toggle
  // can carry them across. Derived (stably) from the query string.
  const filters = useMemo(() => {
    const f = {};
    for (const key of ["search", "roomType", "minPrice", "maxPrice", "verified"]) {
      const v = searchParams.get(key);
      if (v) f[key] = v;
    }
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const { listings: rawListings, loading, error, fetchWithin } = useMapListings();
  // ListingMap silently drops listings without real coordinates — filter here
  // too so the clickable left list, the "N HOMES" count, and the map pins
  // always refer to the exact same set.
  const listings = useMemo(() => rawListings.filter(hasRealCoords), [rawListings]);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [moved, setMoved] = useState(false);

  const lastBox = useRef(null); // most recent viewport, for filter-driven refetch
  const cardRefs = useRef({}); // listingId → card element, for scroll-into-view

  // Initial load + explicit "Search this area".
  const requestListings = useCallback(
    (box) => {
      lastBox.current = box;
      fetchWithin(box, filters);
    },
    [fetchWithin, filters],
  );

  const handleSearchArea = useCallback(
    (box) => {
      lastBox.current = box;
      fetchWithin(box, filters);
      setMoved(false);
    },
    [fetchWithin, filters],
  );

  // Refetch the current viewport whenever filters change.
  useEffect(() => {
    if (lastBox.current) fetchWithin(lastBox.current, filters);
  }, [filters, fetchWithin]);

  // Surface fetch errors without blanking the map.
  useEffect(() => {
    if (error) toast.error(error.response?.data?.message || "Failed to load map");
  }, [error]);

  // Selecting a pin scrolls its card into view (harmless when the card was clicked).
  useEffect(() => {
    if (selectedId) {
      cardRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedId]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const setPriceBand = (bandValue) => {
    const band = PRICE_BANDS.find((b) => b.value === bandValue) || PRICE_BANDS[0];
    const next = new URLSearchParams(searchParams);
    band.min ? next.set("minPrice", band.min) : next.delete("minPrice");
    band.max ? next.set("maxPrice", band.max) : next.delete("maxPrice");
    setSearchParams(next, { replace: true });
  };

  const currentBand =
    PRICE_BANDS.find(
      (b) =>
        b.min === (searchParams.get("minPrice") || "") &&
        b.max === (searchParams.get("maxPrice") || ""),
    )?.value ?? "";

  const selectClass =
    "flex items-center gap-2 text-sm bg-transparent outline-none cursor-pointer focus:ring-0";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <section className="bg-surface-bright border-b border-hairline px-grid-margin py-3 z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-2 divide-x divide-hairline">
            <Field label="Search campus/area">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-slate-muted">
                  search
                </span>
                <input
                  type="text"
                  value={searchParams.get("search") || ""}
                  onChange={(e) => setParam("search", e.target.value)}
                  placeholder="Kenyatta University…"
                  className="bg-transparent border-none p-0 text-sm outline-none placeholder:text-outline-variant w-44"
                />
              </div>
            </Field>

            <Field label="Price range">
              <select
                value={currentBand}
                onChange={(e) => setPriceBand(e.target.value)}
                className={selectClass}
              >
                {PRICE_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Property type">
              <select
                value={searchParams.get("roomType") || ""}
                onChange={(e) => setParam("roomType", e.target.value)}
                className={selectClass}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Trust">
              <button
                type="button"
                onClick={() =>
                  setParam("verified", searchParams.get("verified") ? "" : "true")
                }
                className="flex items-center gap-2 text-sm"
                aria-pressed={!!searchParams.get("verified")}
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    searchParams.get("verified")
                      ? "text-emerald-verified"
                      : "text-slate-muted"
                  }`}
                  style={
                    searchParams.get("verified")
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  verified
                </span>
                Verified only
              </button>
            </Field>
          </div>

          <div className="flex items-center gap-4">
            <MapToggle active="map" />
            <span className="font-label-eyebrow text-label-eyebrow text-slate-muted whitespace-nowrap">
              {listings.length} HOMES
            </span>
          </div>
        </div>
      </section>

      {/* Split layout */}
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-full md:w-[40%] lg:w-[38%] bg-surface-bone overflow-y-auto border-r border-hairline">
          {loading && listings.length === 0 ? (
            <div className="divide-y divide-hairline">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 flex gap-6">
                  <div className="w-32 h-32 rounded-xl bg-surface-container animate-pulse" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-3 w-24 bg-surface-container animate-pulse" />
                    <div className="h-5 w-40 bg-surface-container animate-pulse" />
                    <div className="h-3 w-32 bg-surface-container animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-grid-margin">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                map_search
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                no rooms in this area
              </h3>
              <p className="font-body-main text-on-surface-variant max-w-xs text-sm">
                Pan or zoom the map and press “Search this area”, or widen your
                filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {listings.map((listing) => (
                <MapListingCard
                  key={listing._id}
                  ref={(el) => {
                    if (el) cardRefs.current[listing._id] = el;
                    else delete cardRefs.current[listing._id];
                  }}
                  listing={listing}
                  isActive={hoveredId === listing._id || selectedId === listing._id}
                  onHover={() => setHoveredId(listing._id)}
                  onLeave={() => setHoveredId(null)}
                  onSelect={() => setSelectedId(listing._id)}
                />
              ))}
            </div>
          )}
        </aside>

        <ListingMap
          listings={listings}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={setSelectedId}
          onRequestListings={requestListings}
          moved={moved}
          onMoved={() => setMoved(true)}
          onSearchArea={handleSearchArea}
        />
      </main>
    </div>
  );
}
