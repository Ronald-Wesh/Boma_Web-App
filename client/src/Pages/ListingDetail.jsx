import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listingAPI, reviewAPI } from "../Utils/api";
import { ROOM_LABEL, haversineKm } from "../Utils/listingHelpers";
import ListingGallery from "../components/listings/ListingGallery";
import ListingSidebar from "../components/listings/ListingSidebar";
import CommunityFeedback from "../components/listings/CommunityFeedback";
import SimilarListings from "../components/listings/SimilarListings";

function buildSpecs(listing, distanceKm) {
  const features = listing.features || [];
  const amenities = listing.amenities || [];
  const has = (list, value) =>
    list.some((item) => item.toLowerCase().includes(value));

  return [
    { label: "Room Type", value: ROOM_LABEL[listing.roomType] || "Room" },
    { label: "Bathrooms", value: listing.bathrooms ?? "—" },
    { label: "Furnished", value: has(features, "furnish") ? "Yes" : "No" },
    {
      label: "Water",
      value:
        has(features, "water") || has(amenities, "borehole") ? "Included" : "—",
    },
    { label: "WiFi", value: has(features, "wi-fi") ? "Available" : "—" },
    {
      label: "Security",
      value:
        has(amenities, "security") || has(amenities, "cctv") ? "24/7" : "Standard",
    },
    {
      label: "Distance",
      value: distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—",
    },
    { label: "Status", value: listing.status || "available" },
  ];
}

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0 });

    listingAPI
      .getListingById(id)
      .then(async ({ data }) => {
        if (!active) return;
        setListing(data);

        const buildingId = data.building?._id;
        const campusId = data.building?.campus?._id;
        const [revRes, simRes] = await Promise.allSettled([
          buildingId
            ? reviewAPI.getBuildingReviews(buildingId)
            : Promise.resolve(null),
          campusId
            ? listingAPI.getAllListings({ campus: campusId, limit: 4 })
            : Promise.resolve(null),
        ]);
        if (!active) return;

        if (revRes.status === "fulfilled" && revRes.value) {
          const rd = revRes.value.data;
          setReviews(Array.isArray(rd) ? rd : rd.reviews || []);
        }
        if (simRes.status === "fulfilled" && simRes.value) {
          const sd = simRes.value.data;
          setSimilar(
            (sd.listings || [])
              .filter((item) => item._id !== data._id)
              .slice(0, 3),
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.status === 404 ? "notfound" : "error");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-grid-margin py-section-gap">
        <div className="aspect-[2.4] rounded-xl bg-surface-container animate-pulse mb-12" />
        <div className="h-8 w-72 bg-surface-container animate-pulse mb-4" />
        <div className="h-4 w-96 bg-surface-container animate-pulse" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto text-center px-grid-margin py-section-gap min-h-[50vh] flex flex-col justify-center">
        <h1 className="font-headline-section text-headline-section text-primary lowercase mb-4">
          {error === "notfound" ? "listing not found" : "something went wrong"}
        </h1>
        <p className="font-body-main text-on-surface-variant mb-8">
          {error === "notfound"
            ? "This listing may have been removed."
            : "We couldn't load this listing. Please try again."}
        </p>
        <Link
          to="/listings"
          className="inline-block mx-auto bg-secondary-container text-honey-ink px-8 py-3 rounded-lg font-body-strong hover:opacity-90 transition-all"
        >
          browse listings
        </Link>
      </div>
    );
  }

  const building = listing.building;
  const campus = building?.campus;
  const distanceKm = campus
    ? haversineKm(listing.location?.coordinates, campus.location?.coordinates)
    : null;

  const area = listing.address || building?.address || building?.name || "";
  const eyebrowParts = [area];
  if (campus) {
    eyebrowParts.push(
      distanceKm != null
        ? `${distanceKm.toFixed(1)}KM TO ${campus.name}`
        : campus.name,
    );
  }
  const eyebrow = eyebrowParts.filter(Boolean).join(" · ");
  const specs = buildSpecs(listing, distanceKm);

  return (
    <div className="max-w-7xl mx-auto px-grid-margin py-stack-lg">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-stack-lg flex-wrap">
        <Link
          to="/listings"
          className="font-label-eyebrow text-label-eyebrow text-slate-muted hover:text-primary transition-colors uppercase"
        >
          Listings
        </Link>
        {campus && (
          <>
            <span className="text-outline-variant">/</span>
            <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase">
              {campus.shortName || campus.name}
            </span>
          </>
        )}
        <span className="text-outline-variant">/</span>
        <span className="font-label-eyebrow text-label-eyebrow text-primary uppercase truncate">
          {listing.title}
        </span>
      </nav>

      <ListingGallery images={listing.images} title={listing.title} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left column */}
        <div className="lg:col-span-8">
          <div className="mb-stack-lg">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {eyebrow && (
                <span className="font-label-eyebrow text-label-eyebrow text-primary tracking-[0.2em] uppercase">
                  {eyebrow}
                </span>
              )}
              {listing.isVerified && (
                <span className="bg-emerald-verified/10 text-emerald-verified text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase">
                  <span
                    className="material-symbols-outlined text-[12px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  verified building
                </span>
              )}
            </div>
            <h1 className="font-headline-section text-headline-section text-primary lowercase mb-4">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              {building?.average_rating > 0 && (
                <div className="flex items-center gap-1 text-secondary-container">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-body-strong">
                    {building.average_rating.toFixed(1)}
                  </span>
                  <span className="text-slate-muted font-body-main">
                    ({building.total_reviews || 0} reviews)
                  </span>
                </div>
              )}
              <span className="w-1 h-1 bg-outline-variant rounded-full" />
              <span className="font-price-tabular text-primary">
                KSh {listing.price?.toLocaleString()} / mo
              </span>
            </div>
          </div>

          {/* Overview */}
          <section className="mb-section-gap pt-stack-lg border-t border-hairline">
            <h2 className="font-body-strong text-primary lowercase mb-2">
              the modern homestead for students.
            </h2>
            <p className="text-slate-muted leading-relaxed">
              {listing.description}
            </p>
          </section>

          {/* Spec grid */}
          <section className="mb-section-gap">
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-hairline">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="p-6 border-r border-b border-hairline"
                >
                  <p className="font-label-eyebrow text-label-eyebrow text-slate-muted mb-1 uppercase">
                    {spec.label}
                  </p>
                  <p className="font-body-strong text-primary capitalize">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <CommunityFeedback building={building} reviews={reviews} />
        </div>

        {/* Right column */}
        <ListingSidebar listing={listing} />
      </div>

      <SimilarListings listings={similar} />
    </div>
  );
}
