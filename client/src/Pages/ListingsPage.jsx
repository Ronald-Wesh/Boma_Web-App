import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ListingCard from "../components/ListingCard";
import { useAuth } from "../hooks/useAuth";
import { listingAPI } from "../Utils/api";
import { normalizeListing } from "../Utils/listings";

function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-8 py-20 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">No listings match these filters</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Adjust price, status, bedroom count, or the nearby search coordinates and try again.
      </p>
    </div>
  );
}

function FilterField({ label, children, hint }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </label>
  );
}

const initialFilters = {
  search: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  status: "",
  lng: "",
  lat: "",
  maxDistance: "5000",
  sort: "newest",
};

export default function ListingsPage() {
  const { isLandlord } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebouncedValue(filters.search);

  useEffect(() => {
    let isMounted = true;

    const fetchListings = async () => {
      setLoading(true);

      try {
        const params = {
          page,
          limit: 12,
          sort: filters.sort,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(filters.minPrice ? { minPrice: filters.minPrice } : {}),
          ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
          ...(filters.bedrooms ? { bedrooms: filters.bedrooms } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.lng && filters.lat
            ? {
                lng: filters.lng,
                lat: filters.lat,
                maxDistance: filters.maxDistance || 5000,
              }
            : {}),
        };

        const response = await listingAPI.getAllListings(params);
        if (!isMounted) {
          return;
        }

        setListings(
          (response.data.listings || []).map((listing) => normalizeListing(listing)),
        );
        setPagination(
          response.data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
          },
        );
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.message || "Failed to load listings");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchListings();

    return () => {
      isMounted = false;
    };
  }, [
    debouncedSearch,
    filters.bedrooms,
    filters.lat,
    filters.lng,
    filters.maxDistance,
    filters.maxPrice,
    filters.minPrice,
    filters.sort,
    filters.status,
    page,
  ]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleDelete = (listingId) => {
    setListings((current) => current.filter((listing) => listing._id !== listingId));
    setPagination((current) => ({
      ...current,
      total: Math.max(0, current.total - 1),
    }));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7efe5_0%,#f8fafc_35%,#eef2ff_100%)]">
      <section className="border-b border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),transparent_32%),linear-gradient(135deg,#fff7ed_0%,#eff6ff_48%,#ecfeff_100%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Property Listings
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Find rentals by price, space, and location radius.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Search available units, apply geospatial filters with longitude-first GeoJSON
              coordinates, and browse fully populated listing data.
            </p>
          </div>

          {isLandlord && (
            <Link
              to="/listings/create"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create Listing
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm lg:hidden"
          >
            Filters
            <span>{showFilters ? "Hide" : "Show"}</span>
          </button>

          <div
            className={`${showFilters ? "block" : "hidden"} rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm lg:block`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Reset
              </button>
            </div>

            <div className="space-y-5">
              <FilterField label="Search">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(event) => updateFilter("search", event.target.value)}
                  placeholder="Title, description, amenity"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </FilterField>

              <div className="grid grid-cols-2 gap-3">
                <FilterField label="Min Price">
                  <input
                    type="number"
                    min="0"
                    value={filters.minPrice}
                    onChange={(event) => updateFilter("minPrice", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </FilterField>

                <FilterField label="Max Price">
                  <input
                    type="number"
                    min="0"
                    value={filters.maxPrice}
                    onChange={(event) => updateFilter("maxPrice", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </FilterField>
              </div>

              <FilterField label="Bedrooms">
                <input
                  type="number"
                  min="0"
                  value={filters.bedrooms}
                  onChange={(event) => updateFilter("bedrooms", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </FilterField>

              <FilterField label="Status">
                <select
                  value={filters.status}
                  onChange={(event) => updateFilter("status", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">Any status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </FilterField>

              <FilterField label="Sort">
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilter("sort", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price_asc">Price low to high</option>
                  <option value="price_desc">Price high to low</option>
                </select>
              </FilterField>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Nearby Search</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    GeoJSON uses <span className="font-semibold text-slate-700">longitude first</span>,
                    then latitude.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FilterField label="Lng">
                    <input
                      type="number"
                      step="any"
                      value={filters.lng}
                      onChange={(event) => updateFilter("lng", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </FilterField>

                  <FilterField label="Lat">
                    <input
                      type="number"
                      step="any"
                      value={filters.lat}
                      onChange={(event) => updateFilter("lat", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </FilterField>
                </div>

                <FilterField label="Max Distance (meters)" hint="Used only when both coordinates are provided.">
                  <input
                    type="number"
                    min="1"
                    value={filters.maxDistance}
                    onChange={(event) => updateFilter("maxDistance", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </FilterField>
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {pagination.total} listing{pagination.total === 1 ? "" : "s"} found
              </p>
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {(filters.lng || filters.lat) && (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Proximity filter active
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ListingCardSkeleton key={index} />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}

          <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Previous
            </button>

            <span className="text-sm text-slate-500">
              Offset pagination via <code>skip/limit</code> for the current page.
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
