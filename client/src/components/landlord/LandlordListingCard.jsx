import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../../Utils/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop";

export default function LandlordListingCard({ listing, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await listingAPI.deleteListing(listing._id);
      toast.success("Listing deleted");
      onDeleted(listing._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete this listing");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="bg-surface p-6 flex flex-col gap-4 border border-hairline rounded-xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-container">
        <img
          src={listing.images?.[0] || FALLBACK_IMAGE}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-label-eyebrow tracking-widest uppercase ${
            listing.isVerified
              ? "bg-emerald-verified/10 text-emerald-verified"
              : "bg-amber-pending/10 text-amber-pending"
          }`}
        >
          {listing.isVerified ? "verified" : "pending"}
        </span>
      </div>

      <div>
        <h3 className="font-headline-section text-xl text-primary lowercase">
          {listing.title}
        </h3>
        <p className="font-price-tabular text-secondary-container text-sm">
          KSh {listing.price?.toLocaleString() ?? "—"} / mo · {listing.status}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        <Link
          to={`/landlord/listings/${listing._id}/edit`}
          className="font-body-strong text-sm text-primary hover:text-secondary-container transition-colors"
        >
          edit
        </Link>
        {confirming ? (
          <div className="flex items-center gap-3 ml-auto">
            <span className="font-body-main text-xs text-slate-muted">delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="font-body-strong text-sm text-rose-danger hover:underline disabled:opacity-60"
            >
              yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-body-strong text-sm text-slate-muted"
            >
              no
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto font-label-eyebrow text-[10px] text-slate-muted uppercase hover:text-rose-danger transition-colors"
          >
            delete
          </button>
        )}
      </div>
    </article>
  );
}
