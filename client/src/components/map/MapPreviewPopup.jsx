import { Link } from "react-router-dom";
import { pricePill } from "./mapHelpers";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=80&auto=format&fit=crop";

// Floating mini-card shown over the selected pin. Rendered inside a Leaflet
// <Popup> by ListingMap. "View details" routes to the full listing page.
export default function MapPreviewPopup({ listing }) {
  if (!listing) return null;
  const image = listing.images?.[0] || FALLBACK_IMAGE;

  return (
    <div className="flex gap-3 w-56">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
        <img
          src={image}
          alt={listing.title || "Listing"}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <h4 className="font-headline-section text-sm leading-tight text-primary mb-1 lowercase truncate">
          {listing.title}
        </h4>
        <span className="font-price-tabular text-sm text-primary">
          KSh {pricePill(listing.price)}
        </span>
        <Link
          to={`/listings/${listing._id}`}
          className="mt-2 text-[11px] font-body-strong text-secondary flex items-center gap-1 hover:gap-2 transition-all"
        >
          VIEW DETAILS
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
