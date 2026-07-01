import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listingAPI } from "../../Utils/api";
import { featured } from "../../data/homeData";
import EditorialListingCard from "./EditorialListingCard";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop";

const AVAILABILITY_LABEL = {
  available: "available now",
  unavailable: "fully booked",
  pending: "pending",
};

// Maps a raw /api/listings document (see BrowseCard.jsx for the same shape)
// into the presentational props EditorialListingCard expects.
function toCardListing(listing) {
  const building = listing.building;
  const campusShort = building?.campus?.shortName;
  const area = listing.address || building?.address || building?.name || "";

  return {
    id: listing._id,
    to: `/listings/${listing._id}`,
    name: listing.title,
    location: [area, campusShort].filter(Boolean).join(" · "),
    price: `kes ${listing.price?.toLocaleString() ?? "—"}`,
    period: "/mo",
    availability: AVAILABILITY_LABEL[listing.status] || "available now",
    status: listing.isVerified ? "verified" : "pending",
    image: listing.images?.[0] || FALLBACK_IMAGE,
    alt: `${listing.title} listing photo`,
  };
}

// "Editor's Picks" strip on the cream surface — top verified listings,
// newest first, live from the same /api/listings endpoint Browse uses.
export default function FeaturedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listingAPI
      .getAllListings({ verified: true, sort: "newest", limit: 3 })
      .then(({ data }) => {
        if (active) setListings((data.listings || []).map(toCardListing));
      })
      .catch((error) => console.error("Failed to load featured listings", error))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-surface-bone py-section-gap">
      <div className="max-w-7xl mx-auto px-grid-margin">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="font-label-eyebrow text-label-eyebrow text-on-primary-container uppercase tracking-[2px] block mb-2">
              {featured.eyebrow}
            </span>
            <h2 className="font-headline-section text-display-hero-mobile md:text-headline-section text-primary lowercase">
              {featured.heading}
            </h2>
          </div>
          <Link
            to={featured.link.to}
            className="font-body-strong text-primary border-b border-primary hover:text-secondary-container hover:border-secondary-container transition-all pb-1"
          >
            {featured.link.label}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <div className="aspect-[4/5] rounded-xl bg-surface-container animate-pulse mb-6" />
                  <div className="h-3 w-24 bg-surface-container animate-pulse mb-3" />
                  <div className="h-5 w-40 bg-surface-container animate-pulse" />
                </div>
              ))
            : listings.map((listing) => (
                <EditorialListingCard
                  key={listing.id}
                  listing={listing}
                  to={listing.to}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
