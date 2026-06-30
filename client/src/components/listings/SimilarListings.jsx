import { Link } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&auto=format&fit=crop";

export default function SimilarListings({ listings = [] }) {
  if (!listings.length) return null;

  return (
    <section className="mt-section-gap py-section-gap border-t border-hairline">
      <h2 className="font-headline-section text-headline-section text-primary lowercase mb-stack-lg">
        similar listings nearby
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg">
        {listings.map((listing) => {
          const campusShort = listing.building?.campus?.shortName;
          const area = listing.address || listing.building?.address || "";
          const locationLine = [area, campusShort].filter(Boolean).join(" · ");
          return (
            <Link
              key={listing._id}
              to={`/listings/${listing._id}`}
              className="group"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-surface-bone">
                <img
                  src={listing.images?.[0] || FALLBACK_IMAGE}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1">
                <p className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase truncate">
                  {locationLine}
                </p>
                <h4 className="font-body-strong text-primary lowercase group-hover:text-secondary-container transition-colors">
                  {listing.title}
                </h4>
                <p className="font-price-tabular text-primary">
                  KSh {listing.price?.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-slate-muted">
                    / mo
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
