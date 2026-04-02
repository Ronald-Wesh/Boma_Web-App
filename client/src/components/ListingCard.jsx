import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useCallback } from "react";
import { listingAPI, adminAPI } from "../Utils/api";
import { toast } from "sonner";

// ─── Fallback placeholder when listing has no image ───
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&auto=format&fit=crop";

/**
 * ListingCard — Airbnb-inspired card for a single listing.
 *
 * Props:
 *  - listing      : Listing object from backend
 *  - onDelete     : callback after successful delete (parent refreshes list)
 *  - onVerify     : callback after successful verify
 */
export default function ListingCard({ listing, onDelete, onVerify }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // ── Favorite toggle (persisted in localStorage) ──
  const favKey = `fav_${listing?._id}`;
  const [isFavorited, setIsFavorited] = useState(
    () => localStorage.getItem(favKey) === "true",
  );

  const toggleFavorite = useCallback(
    (e) => {
      e.stopPropagation(); // don't navigate when clicking heart
      setIsFavorited((prev) => {
        const next = !prev;
        localStorage.setItem(favKey, String(next));
        return next;
      });
    },
    [favKey],
  );

  // ── Image error fallback ──
  const [imgSrc, setImgSrc] = useState(listing?.image || FALLBACK_IMAGE);
  const handleImgError = () => setImgSrc(FALLBACK_IMAGE);

  // ── Derived flags ──
  const isOwner = user?._id === listing?.createdBy?._id;
  const isNew =
    listing?.createdAt &&
    Date.now() - new Date(listing.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  const showVerifiedBadge =
    listing?.isVerified ||
    listing?.createdBy?.isVerified ||
    listing?.createdBy?.role === "landlord";
  const rating = listing?.building?.average_rating;

  // ── Admin: verify listing ──
  const handleVerify = async (e) => {
    e.stopPropagation();
    try {
      await adminAPI.verifyListing(listing._id);
      toast.success("Listing verified!");
      onVerify?.(listing._id);
    } catch {
      toast.error("Failed to verify listing");
    }
  };

  // ── Delete listing (owner or admin) ──
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this listing permanently?")) return;
    try {
      await listingAPI.deleteListing(listing._id);
      toast.success("Listing deleted");
      onDelete?.(listing._id);
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  return (
    <div
      onClick={() => navigate(`/listings/${listing?._id}`)}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden
                 shadow-sm hover:shadow-xl border border-gray-100
                 transition-all duration-300 ease-out cursor-pointer
                 hover:scale-[1.02] hover:-translate-y-1"
    >
      {/* ── Image Section ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          alt={listing?.title || "Listing"}
          loading="lazy"
          onError={handleImgError}
          className="h-full w-full object-cover transition-transform duration-500
                     group-hover:scale-110"
        />

        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* ── Top badges ── */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isNew && (
            <span
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider
                         bg-gradient-to-r from-amber-400 to-orange-500 text-white
                         rounded-full shadow-lg"
            >
              New
            </span>
          )}
          {showVerifiedBadge && (
            <span
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider
                         bg-gradient-to-r from-emerald-400 to-teal-500 text-white
                         rounded-full shadow-lg flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          )}
          {listing?.status && listing.status !== "available" && (
            <span
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider
                         bg-gray-800/80 text-white rounded-full"
            >
              {listing.status}
            </span>
          )}
        </div>

        {/* ── Favorite heart ── */}
        <button
          onClick={toggleFavorite}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-3 right-3 p-2 rounded-full
                     bg-white/80 backdrop-blur-sm hover:bg-white
                     transition-all duration-200 shadow-md hover:shadow-lg
                     hover:scale-110 active:scale-95"
        >
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${
              isFavorited ? "fill-rose-500 text-rose-500" : "fill-transparent text-gray-600"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            />
          </svg>
        </button>

        {/* ── Price tag ── */}
        <div
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg
                      bg-white/90 backdrop-blur-sm shadow-md"
        >
          <span className="text-base font-bold text-gray-900">
            KES {listing?.price?.toLocaleString() || "N/A"}
          </span>
          <span className="text-xs text-gray-500 font-medium">/mo</span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Title + rating row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-1">
            {listing?.title || "Untitled Listing"}
          </h3>
          {rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium truncate">
            {listing?.address || listing?.building?.address || "Location not specified"}
          </span>
        </div>

        {/* Description — 2 lines max */}
        {listing?.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">
            {listing.description}
          </p>
        )}

        {/* Room details */}
        {(listing?.bedrooms != null || listing?.bathrooms != null) && (
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {listing?.bedrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
              </span>
            )}
            {listing?.bathrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Owner/creator info */}
        {listing?.createdBy?.username && (
          <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-gray-50">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white uppercase">
                {listing.createdBy.username.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium truncate">
              {listing.createdBy.username}
            </span>
          </div>
        )}
      </div>

      {/* ── Action buttons (admin / owner only) ── */}
      {(isAdmin || isOwner) && (
        <div className="flex items-center gap-2 px-4 pb-4">
          {/* Admin: verify button (only if not yet verified) */}
          {isAdmin && !listing?.isVerified && (
            <button
              onClick={handleVerify}
              className="flex-1 py-2 text-xs font-semibold text-emerald-700
                         bg-emerald-50 hover:bg-emerald-100 rounded-lg
                         transition-colors duration-200 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify
            </button>
          )}

          {/* Owner or Admin: delete button */}
          <button
            onClick={handleDelete}
            className="flex-1 py-2 text-xs font-semibold text-rose-700
                       bg-rose-50 hover:bg-rose-100 rounded-lg
                       transition-colors duration-200 flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}