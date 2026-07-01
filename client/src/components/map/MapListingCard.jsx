import { forwardRef } from "react";
import { areaLabel, fullPrice } from "./mapHelpers";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80&auto=format&fit=crop";

// Small material icon per feature/amenity, with a sensible default.
const FEATURE_ICONS = {
  "wi-fi": "wifi",
  wifi: "wifi",
  "water 24/7": "water_drop",
  "borehole water": "water_drop",
  "hot shower": "shower",
  "backup generator": "bolt",
  furnished: "chair",
  balcony: "balcony",
  parking: "local_parking",
  cctv: "security",
  "security guard": "security",
  laundry: "local_laundry_service",
  gym: "fitness_center",
  "study room": "menu_book",
  "study desk": "menu_book",
  cafeteria: "restaurant",
  "tiled floors": "grid_view",
};
const featureIcon = (name) => FEATURE_ICONS[name?.toLowerCase()] || "check_small";

// Compact horizontal card for the Map View list pane (lighter than BrowseCard's
// tall grid card). Highlights when its pin is hovered/selected. Ref forwarded so
// MapView can scroll the selected card into view.
const MapListingCard = forwardRef(function MapListingCard(
  { listing, isActive, onHover, onLeave, onSelect },
  ref,
) {
  const image = listing?.images?.[0] || FALLBACK_IMAGE;
  const features = [
    ...(listing?.features || []),
    ...(listing?.amenities || []),
  ].slice(0, 3);

  return (
    <div
      ref={ref}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`p-6 flex gap-6 cursor-pointer group transition-colors ${
        isActive ? "bg-surface-container" : "hover:bg-surface-container"
      }`}
    >
      <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-surface-container">
        <img
          src={image}
          alt={listing?.title || "Listing"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-label-eyebrow text-label-eyebrow text-slate-muted uppercase truncate">
              {areaLabel(listing)}
            </span>
            {listing?.isVerified && (
              <div className="flex items-center gap-1 bg-emerald-verified/10 px-2 py-0.5 rounded-full flex-shrink-0">
                <span
                  className="material-symbols-outlined text-emerald-verified"
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: "14px" }}
                >
                  verified
                </span>
                <span className="text-[10px] font-bold text-emerald-verified uppercase tracking-wider">
                  Verified
                </span>
              </div>
            )}
          </div>

          <h3 className="font-headline-section text-[20px] text-primary tracking-tight leading-tight mb-2 lowercase truncate">
            {listing?.title}
          </h3>

          <div className="flex flex-wrap gap-3 text-slate-muted text-xs">
            {features.map((f) => (
              <span key={f} className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  {featureIcon(f)}
                </span>
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-4">
          <span className="font-price-tabular text-price-tabular text-primary">
            {fullPrice(listing?.price)}
          </span>
        </div>
      </div>
    </div>
  );
});

export default MapListingCard;
