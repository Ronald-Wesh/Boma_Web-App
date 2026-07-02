import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI, enquiryAPI, forumAPI } from "../Utils/api";
import { useAuth } from "../hooks/useAuth";
import LandlordListingCard from "../components/landlord/LandlordListingCard";
import LandlordBuildingCard from "../components/landlord/LandlordBuildingCard";

const TABS = [
  { key: "listings", label: "my listings" },
  { key: "buildings", label: "my buildings" },
  { key: "enquiries", label: "enquiries" },
];

function EmptyState({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-grid-margin">
      <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
        {icon}
      </span>
      <h3 className="font-headline-section text-2xl text-primary lowercase mb-2">
        {title}
      </h3>
      <p className="font-body-main text-on-surface-variant max-w-sm text-sm">{body}</p>
    </div>
  );
}

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildingForums, setBuildingForums] = useState({});

  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [listingsRes, enquiriesRes] = await Promise.all([
        listingAPI.getAllListings({ createdBy: user._id }),
        enquiryAPI.getMine(),
      ]);
      setListings(listingsRes.data?.listings || []);
      setEnquiries(enquiriesRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load your dashboard");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  // Buildings behind this landlord's own listings — there's no stored
  // landlord->building relationship, so it's derived from `listings` here.
  const buildings = useMemo(() => {
    const seen = new Map();
    for (const { building } of listings) {
      if (building?._id && !seen.has(building._id)) seen.set(building._id, building);
    }
    return [...seen.values()];
  }, [listings]);

  // Lazy-fetch forum activity per building, only once the tab is opened.
  useEffect(() => {
    if (tab !== "buildings") return;
    const missing = buildings.filter((b) => !(b._id in buildingForums));
    if (missing.length === 0) return;
    let active = true;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (b) => {
          try {
            const { data } = await forumAPI.getBuildingForums(b._id);
            return [b._id, Array.isArray(data) ? data : []];
          } catch {
            return [b._id, []];
          }
        }),
      );
      if (active) setBuildingForums((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    return () => {
      active = false;
    };
  }, [tab, buildings, buildingForums]);

  const handleDeleted = (listingId) => {
    setListings((prev) => prev.filter((l) => l._id !== listingId));
  };

  const markContacted = async (enquiryId) => {
    try {
      await enquiryAPI.updateStatus(enquiryId, "contacted");
      setEnquiries((prev) =>
        prev.map((e) => (e._id === enquiryId ? { ...e, status: "contacted" } : e)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update this enquiry");
    }
  };

  return (
    <div>
      <header className="w-full py-section-gap bg-surface-bone border-b border-hairline">
        <div className="max-w-screen-2xl mx-auto px-grid-margin flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase">
              landlord dashboard
            </span>
            <h1 className="font-display-hero text-display-hero-mobile text-primary lowercase mt-stack-sm">
              your listings, at a glance.
            </h1>
          </div>
          <Link
            to="/landlord/listings/new"
            className="bg-secondary-container text-honey-ink px-6 py-3 rounded-full font-body-strong lowercase hover:brightness-110 active:scale-95 transition-all"
          >
            + add listing
          </Link>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-grid-margin">
        <div className="flex gap-8 border-b border-hairline mt-stack-lg">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-4 font-body-strong lowercase border-b-2 transition-colors ${
                tab === t.key
                  ? "text-primary border-primary"
                  : "text-slate-muted border-transparent hover:text-primary"
              }`}
            >
              {t.label}
              {t.key === "buildings" && buildings.length > 0 && (
                <span className="ml-2 text-xs text-slate-muted">({buildings.length})</span>
              )}
              {t.key === "enquiries" &&
                enquiries.some((e) => e.status === "new") && (
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-secondary-container align-middle" />
                )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-grid-margin py-section-gap">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 bg-surface-container animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tab === "listings" ? (
          listings.length === 0 ? (
            <EmptyState
              icon="home_work"
              title="no listings yet"
              body="add your first listing to start reaching students."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <LandlordListingCard
                  key={listing._id}
                  listing={listing}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )
        ) : tab === "buildings" ? (
          buildings.length === 0 ? (
            <EmptyState
              icon="apartment"
              title="no buildings yet"
              body="buildings behind your listings show up here, with their reviews and forum activity."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((building) => (
                <LandlordBuildingCard
                  key={building._id}
                  building={building}
                  forumPosts={buildingForums[building._id] ?? null}
                />
              ))}
            </div>
          )
        ) : enquiries.length === 0 ? (
          <EmptyState
            icon="mail"
            title="no enquiries yet"
            body="when a tenant enquires about one of your listings, it shows up here."
          />
        ) : (
          <div className="max-w-3xl divide-y divide-hairline border-t border-hairline">
            {enquiries.map((enquiry) => (
              <div key={enquiry._id} className="py-stack-lg flex items-start justify-between gap-6">
                <div>
                  <p className="font-body-strong text-primary lowercase">
                    {enquiry.listing?.title || "listing"}
                  </p>
                  <p className="font-label-eyebrow text-label-eyebrow text-slate-muted">
                    {enquiry.name} · {enquiry.phone}
                  </p>
                  <p className="font-body-main text-slate-muted mt-2">{enquiry.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-label-eyebrow tracking-widest uppercase ${
                      enquiry.status === "contacted"
                        ? "bg-emerald-verified/10 text-emerald-verified"
                        : "bg-amber-pending/10 text-amber-pending"
                    }`}
                  >
                    {enquiry.status}
                  </span>
                  {enquiry.status === "new" && (
                    <button
                      type="button"
                      onClick={() => markContacted(enquiry._id)}
                      className="font-body-strong text-xs text-primary hover:text-secondary-container"
                    >
                      mark contacted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
