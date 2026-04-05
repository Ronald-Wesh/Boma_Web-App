import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../Utils/api";
import {
  fallbackListingImage,
  formatCurrency,
  formatStatusLabel,
  normalizeListing,
} from "../Utils/listings";
import { useAuth } from "../hooks/useAuth";

const statusClasses = {
  available: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  unavailable: "bg-rose-100 text-rose-800",
};

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
    >
      {children}
    </button>
  );
}

export default function ListingCard({ listing: rawListing, onDelete }) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const listing = normalizeListing(rawListing);
  const [imageIndex, setImageIndex] = useState(0);

  if (!listing) {
    return null;
  }

  const images = listing.images?.length ? listing.images : [fallbackListingImage];
  const landlordId = listing.landlordId?._id || listing.landlordId?.id;
  const isOwner = landlordId && user?.id === landlordId;
  const canDelete = isOwner || isAdmin;
  const currentImage = images[imageIndex] || fallbackListingImage;

  const nextImage = (event) => {
    event.stopPropagation();
    setImageIndex((current) => (current + 1) % images.length);
  };

  const previousImage = (event) => {
    event.stopPropagation();
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleDelete = async (event) => {
    event.stopPropagation();

    if (!window.confirm("Delete this listing permanently?")) {
      return;
    }

    try {
      await listingAPI.deleteListing(listing._id);
      toast.success("Listing deleted");
      onDelete?.(listing._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete listing");
    }
  };

  return (
    <article
      className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/listings/${listing._id}`)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            navigate(`/listings/${listing._id}`);
          }
        }}
        className="cursor-pointer outline-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={currentImage}
            alt={listing.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = fallbackListingImage;
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span className="rounded-full bg-white/92 px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm">
              {formatCurrency(listing.price)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                statusClasses[listing.status] || statusClasses.available
              }`}
            >
              {formatStatusLabel(listing.status)}
            </span>
          </div>

          {images.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 flex items-center p-3">
                <IconButton label="Previous image" onClick={previousImage}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                </IconButton>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center p-3">
                <IconButton label="Next image" onClick={nextImage}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </IconButton>
              </div>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-900/55 px-2 py-1">
                {images.map((image, index) => (
                  <span
                    key={`${image}-${index}`}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === imageIndex ? "bg-white" : "bg-white/45"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{listing.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {listing.buildingId?.name || "Independent property"}
                </p>
              </div>
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
              {listing.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h3m4 0h3M7 15h10" />
              </svg>
              {listing.bedrooms} bed
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V5a5 5 0 0110 0v6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14v8H5z" />
              </svg>
              {listing.bathrooms} bath
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.amenities?.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {amenity}
              </span>
            ))}
            {listing.amenities?.length > 4 && (
              <span className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-500">
                +{listing.amenities.length - 4} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">
                {listing.landlordId?.name || "Listed by landlord"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {listing.buildingId?.address || "Address available on detail page"}
              </p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/listings/${listing._id}`);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              View Details
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {canDelete && (
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
          >
            Delete listing
          </button>
        </div>
      )}
    </article>
  );
}
