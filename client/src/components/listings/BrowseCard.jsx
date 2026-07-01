import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop";

const ROOM_LABEL = {
  bedsitter: "bedsitter",
  single_room: "single room",
  shared_room: "shared room",
  studio: "studio",
  one_bedroom: "1 bedroom",
  two_bedroom: "2 bedroom",
  other: "room",
};

// Editorial Browse card backed by a live listing document.
export default function BrowseCard({ listing }) {
  const navigate = useNavigate();

  const favKey = `fav_${listing?._id}`;
  const [isFavorited, setIsFavorited] = useState(
    () => localStorage.getItem(favKey) === "true",
  );
  const [imgSrc, setImgSrc] = useState(
    listing?.images?.[0] || FALLBACK_IMAGE,
  );

  const toggleFavorite = useCallback(
    (event) => {
      event.stopPropagation();
      setIsFavorited((prev) => {
        const next = !prev;
        localStorage.setItem(favKey, String(next));
        return next;
      });
    },
    [favKey],
  );

  const building = listing?.building;
  const campusShort = building?.campus?.shortName;
  const area = listing?.address || building?.address || building?.name || "";
  const locationLine = [area, campusShort].filter(Boolean).join(" · ");

  const detailBits = [
    ROOM_LABEL[listing?.roomType] || "room",
    ...(listing?.features || []).slice(0, 2),
  ];
  const details = detailBits.join(" · ").toLowerCase();

  const rating = building?.average_rating;
  const isVerified = listing?.isVerified;

  return (
    <article
      onClick={() => navigate(`/listings/${listing?._id}`)}
      className="bg-surface p-6 flex flex-col group cursor-pointer transition-all duration-300 hover:bg-surface-container-low"
    >
      <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-xl bg-surface-container">
        <img
          src={imgSrc}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          alt={listing?.title || "Listing"}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorited ? "Remove from favorites" : "Save listing"}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-circle flex items-center justify-center text-rose-danger hover:scale-110 transition-transform"
        >
          <span
            className="material-symbols-outlined"
            style={isFavorited ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>
      </div>

      <div className="flex flex-col flex-1">
        {locationLine && (
          <span className="font-label-eyebrow text-label-eyebrow text-on-surface-variant uppercase mb-2 truncate">
            {locationLine}
          </span>
        )}
        <h2 className="font-headline-section text-2xl text-primary lowercase tracking-tight mb-2 group-hover:text-secondary-container transition-colors">
          {listing?.title}
        </h2>
        <p className="font-body-main text-slate-muted text-sm mb-6">{details}</p>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-price-tabular text-secondary text-lg">
              KSh {listing?.price?.toLocaleString() ?? "—"}{" "}
              <span className="text-xs text-on-surface-variant font-body-main">
                / mo
              </span>
            </span>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-secondary-container text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-price-tabular text-sm text-primary">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-hairline flex items-center">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-label-eyebrow tracking-widest ${
                isVerified
                  ? "bg-emerald-verified/10 text-emerald-verified"
                  : "bg-amber-pending/10 text-amber-pending"
              }`}
            >
              {isVerified ? "VERIFIED" : "PENDING"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
