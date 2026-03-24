import { useState, useEffect, useCallback, useRef } from "react";
import { listingAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth"; //gives us the user and isAuthenticated
import { useNavigate } from "react-router-dom"; //changing pages
import ListingCard from "../components/ListingCard";
import { toast } from "sonner";

// ─── Skeleton card for loading state ───
function SkeletonCard() {
  //is a fake loading card that is shown while the listings are loading
  return (
    //instaed of a blank screen users seee loading animation
    <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gray-200" />
      {/* Body skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 rounded-full w-8" />
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 bg-gray-100 rounded-full w-16" />
          <div className="h-3 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state illustration ───
function EmptyState({ search }) {
  //this is what is shown when there are no listings=when search no results
  return (
    //{search} is a prop(data passed into)=what user is searching for
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4">
      {/* House icon */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-indigo-400"
          fill="NONE"//DONT FILL SHAPE WITH COLOR
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.7}
        >
          <path
            strokeLinecap="round"//ends of lines smooth
            strokeLinejoin="round"//corners smooth
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"//drawing instructions
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No listings found
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {search
          ? `We couldn't find any listings matching "${search}". Try a different search term or adjust your filters.`
          : "There are no listings available right now. Check back later or adjust your filters."}
      </p>
    </div>
  );
}

// ─── Debounce hook ───
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Listings — main listings page with Airbnb-style search, filters, grid.
 */
export default function Listings() {
  // ── State ──
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const debouncedSearch = useDebounce(search);
  const topRef = useRef(null);

  // ── Fetch listings from backend ──
  const fetchListings = useCallback(
    async (pageNum = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = {
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(status && { status }),
          ...(verified && { verified: true }),
          sort,
          page: pageNum,
          limit: 12,
        };

        const response = await listingAPI.getAllListings(params);
        const data = response.data;

        // Filter by price range client-side (backend doesn't have price filter yet)
        // let filtered = data.listings || [];
        let filtered = (data.listings || []).map((l) => ({
          ...l,
          verified: l.isVerified, // 🔥 normalize backend → frontend
        }));
        if (priceMin)
          filtered = filtered.filter((l) => l.price >= Number(priceMin));
        if (priceMax)
          filtered = filtered.filter((l) => l.price <= Number(priceMax));

        if (append) {
          setListings((prev) => [...prev, ...filtered]);
        } else {
          setListings(filtered);
        }

        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to fetch listings");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, status, verified, sort, priceMin, priceMax],
  );

  // ── Re-fetch when filters change (reset to page 1) ──
  useEffect(() => {
    setPage(1);
    fetchListings(1, false);
  }, [fetchListings]);

  // ── Load more (pagination) ──
  const loadMore = () => {
    if (page < totalPages) fetchListings(page + 1, true);
  };

  // ── Callbacks for child actions ──
  const handleDelete = (id) =>
    setListings((prev) => prev.filter((l) => l._id !== id));
  const handleVerify = (id) =>
    setListings((prev) =>
      prev.map((l) => (l._id === id ? { ...l, isVerified: true } : l)),
    );

  // ── Clear all filters ──
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setVerified(false);
    setSort("newest");
    setPriceMin("");
    setPriceMax("");
  };

  const hasActiveFilters =
    search || status || verified || sort !== "newest" || priceMin || priceMax;

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50"
    >
      {/* ════════════════════════════════════ */}
      {/*          GRADIENT HEADER             */}
      {/* ════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 pt-8 pb-24 px-4 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Discover Spaces
              </h1>
              <p className="text-indigo-100 mt-1 text-sm md:text-base">
                Find your perfect student home or rental
              </p>
            </div>

            {/* Create listing button — only for logged-in users */}
            {isAuthenticated && (
              <button
                onClick={() => navigate("/listings/create")}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm
                           text-white font-semibold rounded-xl border border-white/25
                           hover:bg-white/25 transition-all duration-200 text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════ */}
      {/*        STICKY SEARCH + FILTERS      */}
      {/* ════════════════════════════════════ */}
      <div className="sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 -mt-16">
          <div
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50
                          p-4 md:p-5"
          >
            {/* Row 1: Search input */}
            <div className="relative mb-4">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by location, title, or keyword..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200
                           text-sm text-gray-800 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400
                           transition-all duration-200"
              />
            </div>

            {/* Row 2: Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                             text-sm text-gray-700 cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400
                             transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="pending">Pending</option>
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                             text-sm text-gray-700 cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400
                             transition-all duration-200"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Price range */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min KES"
                  min="0"
                  className="w-24 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                             text-sm text-gray-700 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                             transition-all duration-200
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max KES"
                  min="0"
                  className="w-24 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                             text-sm text-gray-700 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                             transition-all duration-200
                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Verified toggle */}
              <button
                onClick={() => setVerified((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                            border transition-all duration-200
                            ${
                              verified
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Verified Only
              </button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500
                             hover:text-gray-700 hover:bg-gray-100 border border-gray-200
                             transition-all duration-200"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Results count */}
            {!loading && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {listings.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">{total}</span>{" "}
                  listings
                </p>
                {/* Mobile create button */}
                {isAuthenticated && (
                  <button
                    onClick={() => navigate("/listings/create")}
                    className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600
                               text-white font-medium rounded-lg text-xs hover:bg-indigo-700
                               transition-colors duration-200"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════ */}
      {/*           LISTINGS GRID             */}
      {/* ════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div
          className="grid gap-6
                      grid-cols-1
                      sm:grid-cols-2
                      lg:grid-cols-3
                      xl:grid-cols-4"
        >
          {/* Loading skeleton */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                onDelete={handleDelete}
                onVerify={handleVerify}
              />
            ))
          ) : (
            <EmptyState search={debouncedSearch} />
          )}
        </div>

        {/* ── Load More / Pagination ── */}
        {!loading && page < totalPages && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600
                         text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25
                         hover:shadow-xl hover:shadow-indigo-500/30
                         hover:from-indigo-700 hover:to-purple-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all duration-300 flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* End of results message */}
        {!loading && listings.length > 0 && page >= totalPages && (
          <p className="text-center text-sm text-gray-400 mt-10">
            You've seen all {total} listings ✨
          </p>
        )}
      </div>
    </div>
  );
}
