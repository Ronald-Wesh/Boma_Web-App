import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI, campusAPI } from "../Utils/api";
import { BUDGET, SORT_OPTIONS } from "../data/browseFilters";
import ListingFilters from "../components/listings/ListingFilters";
import BrowseCard from "../components/listings/BrowseCard";
import MapToggle from "../components/map/MapToggle";

const PAGE_SIZE = 9;

// Debounce a value so typing in the search box doesn't spam the API.
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Compact page list, e.g. [1, 2, 3, "…", 12]
function pageList(current, totalPages) {
  if (totalPages <= 5)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, 2, 3, current, totalPages]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export default function Browse() {
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("campus") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [budget, setBudget] = useState(BUDGET.max);
  const [selected, setSelected] = useState({
    campuses: [],
    roomTypes: [],
    amenities: [],
  });

  const [campuses, setCampuses] = useState([]);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const topRef = useRef(null);

  // Load campuses once for the sidebar.
  useEffect(() => {
    campusAPI
      .getAllCampuses()
      .then((res) => setCampuses(res.data || []))
      .catch(() => setCampuses([]));
  }, []);

  const buildParams = useCallback(
    (pageNum) => {
      const params = { page: pageNum, limit: PAGE_SIZE, sort };
      if (debouncedSearch) params.search = debouncedSearch;
      if (verifiedOnly) params.verified = true;
      if (selected.roomTypes.length)
        params.roomType = selected.roomTypes.join(",");
      if (selected.amenities.length)
        params.amenities = selected.amenities.join(",");
      if (selected.campuses.length) params.campus = selected.campuses.join(",");
      if (budget < BUDGET.max) params.maxPrice = budget;
      return params;
    },
    [
      debouncedSearch,
      verifiedOnly,
      sort,
      budget,
      selected.roomTypes,
      selected.amenities,
      selected.campuses,
    ],
  );

  const runFetch = useCallback(
    async (pageNum, append) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const { data } = await listingAPI.getAllListings(buildParams(pageNum));
        const incoming = data.listings || [];
        setListings((prev) => (append ? [...prev, ...incoming] : incoming));
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || pageNum);
      } catch (error) {
        console.error("Failed to load listings", error);
        toast.error(
          error.response?.data?.message || "Failed to load listings",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams],
  );

  // Re-fetch from page 1 whenever any filter changes.
  useEffect(() => {
    runFetch(1, false);
  }, [runFetch]);

  const toggle = (key, value) =>
    setSelected((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const goToPage = (pageNum) => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    runFetch(pageNum, false);
  };

  const filters = (
    <ListingFilters
      campuses={campuses}
      selected={selected}
      onToggleCampus={(id) => toggle("campuses", id)}
      onToggleRoomType={(value) => toggle("roomTypes", value)}
      onToggleAmenity={(value) => toggle("amenities", value)}
      budget={budget}
      onBudget={setBudget}
    />
  );

  return (
    <div ref={topRef}>
      {/* Search & filter toolbar */}
      <div className="bg-surface-bone border-b border-hairline py-4 px-grid-margin">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search by area, campus or building"
                className="w-full bg-surface border border-hairline rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-secondary-container focus:border-secondary-container outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              className="md:hidden px-4 py-2 border border-hairline rounded-lg text-xs font-label-eyebrow uppercase"
            >
              filters
            </button>
            <div className="hidden md:block">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="px-4 py-2 border border-hairline rounded-lg text-xs font-label-eyebrow uppercase bg-surface cursor-pointer focus:ring-1 focus:ring-secondary-container outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <MapToggle active="list" />
            <button
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className="flex items-center gap-3"
              aria-pressed={verifiedOnly}
            >
              <span className="text-xs font-label-eyebrow uppercase text-on-surface-variant">
                Verified Only
              </span>
              <span
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  verifiedOnly ? "bg-primary-container" : "bg-surface-container-high"
                }`}
              >
                <span
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                    verifiedOnly ? "right-1" : "left-1"
                  }`}
                />
              </span>
            </button>
            <span className="font-price-tabular text-sm text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
              {total} rooms near you
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-screen-2xl mx-auto flex">
        <aside
          className={`${
            mobileFiltersOpen ? "block" : "hidden"
          } md:block w-full md:w-[260px] border-r border-hairline p-grid-margin md:sticky md:top-16 h-fit`}
        >
          {filters}
        </aside>

        <section className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className="bg-surface p-6">
                  <div className="aspect-[4/3] rounded-xl bg-surface-container animate-pulse mb-6" />
                  <div className="h-3 w-24 bg-surface-container animate-pulse mb-3" />
                  <div className="h-5 w-40 bg-surface-container animate-pulse mb-3" />
                  <div className="h-3 w-32 bg-surface-container animate-pulse" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-section-gap px-grid-margin min-h-[50vh]">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                search_off
              </span>
              <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
                no rooms match those filters
              </h3>
              <p className="font-body-main text-on-surface-variant max-w-sm">
                Try widening your budget or clearing a filter or two.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline">
                {listings.map((listing) => (
                  <BrowseCard key={listing._id} listing={listing} />
                ))}
              </div>

              <div className="p-grid-margin flex flex-col md:flex-row items-center justify-between border-t border-hairline gap-8">
                <div className="flex items-center gap-2">
                  {pageList(page, totalPages).map((p, index, arr) => {
                    const gap = index > 0 && p - arr[index - 1] > 1;
                    return (
                      <span key={p} className="flex items-center gap-2">
                        {gap && <span className="px-1 text-on-surface-variant">…</span>}
                        <button
                          type="button"
                          onClick={() => goToPage(p)}
                          className={`w-10 h-10 flex items-center justify-center font-price-tabular rounded-lg transition-colors ${
                            p === page
                              ? "bg-secondary-container text-honey-ink"
                              : "hover:bg-surface-container"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                </div>

                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => runFetch(page + 1, true)}
                    disabled={loadingMore}
                    className="px-8 py-3 border border-hairline rounded-lg font-label-eyebrow uppercase text-on-surface-variant hover:border-secondary-container hover:text-secondary-container transition-all disabled:opacity-60"
                  >
                    {loadingMore ? "loading…" : "load more listings"}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
