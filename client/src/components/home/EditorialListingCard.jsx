import { Link } from "react-router-dom";

const STATUS_BADGE = {
  verified: {
    label: "VERIFIED",
    icon: "verified",
    className: "bg-emerald-verified text-surface-bone",
    fill: true,
  },
  pending: {
    label: "PENDING VERIFICATION",
    icon: "schedule",
    className: "bg-amber-pending text-on-secondary-container",
    fill: false,
  },
};

// Editorial listing card: tall image with a status badge, monospaced
// location eyebrow, lowercase name, and tabular price.
export default function EditorialListingCard({ listing, to = "/listings" }) {
  const badge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.pending;

  return (
    <Link to={to} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-full mb-6">
        <img
          src={listing.image}
          alt={listing.alt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div
          className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-label-eyebrow flex items-center gap-1 ${badge.className}`}
        >
          <span
            className="material-symbols-outlined text-[12px]"
            style={badge.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {badge.icon}
          </span>
          {badge.label}
        </div>
      </div>
      <div className="space-y-1">
        <span className="font-label-eyebrow text-label-eyebrow text-on-surface-variant uppercase tracking-widest">
          {listing.location}
        </span>
        <h4 className="font-headline-section text-xl text-primary lowercase">
          {listing.name}
        </h4>
        <div className="flex justify-between items-baseline pt-2">
          <span className="font-price-tabular text-lg text-primary">
            {listing.price}
            <span className="text-sm font-body-main text-outline">
              {listing.period}
            </span>
          </span>
          <span className="text-outline text-xs font-body-main">
            {listing.availability}
          </span>
        </div>
      </div>
    </Link>
  );
}
