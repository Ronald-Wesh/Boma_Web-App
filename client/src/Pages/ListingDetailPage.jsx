import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { listingAPI } from "../Utils/api";
import {
  buildOpenStreetMapEmbedUrl,
  buildOpenStreetMapLink,
  fallbackListingImage,
  formatCurrency,
  formatStatusLabel,
  getListingCoordinates,
  normalizeListing,
} from "../Utils/listings";

const statusClasses = {
  available: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  unavailable: "bg-rose-100 text-rose-800",
};

function NearbyCard({ listing }) {
  return (
    <Link
      to={`/listings/${listing._id}`}
      className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        src={listing.images?.[0] || fallbackListingImage}
        alt={listing.title}
        className="h-24 w-24 rounded-2xl object-cover"
      />
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-slate-900">{listing.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{listing.buildingId?.name || "Nearby listing"}</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">{formatCurrency(listing.price)}</p>
      </div>
    </Link>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [nearbyListings, setNearbyListings] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchListing = async () => {
      setLoading(true);

      try {
        const response = await listingAPI.getListingById(id);
        const normalizedListing = normalizeListing(response.data.listing);

        if (!isMounted) {
          return;
        }

        setListing(normalizedListing);
        setSelectedImage(0);

        const { lng, lat } = getListingCoordinates(normalizedListing);
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          const nearbyResponse = await listingAPI.getNearbyListings({
            lng,
            lat,
            maxDistance: 5000,
            limit: 4,
          });

          if (!isMounted) {
            return;
          }

          const normalizedNearby = (nearbyResponse.data.listings || [])
            .map((item) => normalizeListing(item))
            .filter((item) => item._id !== normalizedListing._id);

          setNearbyListings(normalizedNearby);
        } else {
          setNearbyListings([]);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.message || "Failed to load listing");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="aspect-[16/8] animate-pulse rounded-[32px] bg-slate-200" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Listing not found</h1>
        <Link
          to="/listings"
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to listings
        </Link>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [fallbackListingImage];
  const { lng, lat } = getListingCoordinates(listing);
  const mapEmbedUrl = buildOpenStreetMapEmbedUrl(lng, lat);
  const mapLink = buildOpenStreetMapLink(lng, lat);
  const contactHref = listing.landlordId?.email
    ? `mailto:${listing.landlordId.email}?subject=${encodeURIComponent(`Inquiry about ${listing.title}`)}`
    : listing.landlordId?.phone
      ? `tel:${listing.landlordId.phone}`
      : null;

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)]">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/listings" className="text-sm font-semibold text-slate-500 transition hover:text-slate-800">
              Back to listings
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {listing.title}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              {listing.buildingId?.name || "Independent building"} · {listing.buildingId?.address || "Address not provided"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-semibold text-slate-950">{formatCurrency(listing.price)}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${
                statusClasses[listing.status] || statusClasses.available
              }`}
            >
              {formatStatusLabel(listing.status)}
            </span>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <img
              src={images[selectedImage] || fallbackListingImage}
              alt={listing.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`overflow-hidden rounded-[24px] border ${
                  index === selectedImage ? "border-slate-900" : "border-slate-200"
                } bg-white`}
              >
                <img src={image} alt={`${listing.title} ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{listing.description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {listing.bedrooms} bedrooms
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {listing.bathrooms} bathrooms
                </span>
                {listing.features?.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Amenities</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {listing.amenities?.length ? (
                  listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
                    >
                      {amenity}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No amenities listed.</p>
                )}
              </div>
            </div>

            {mapEmbedUrl && (
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-xl font-semibold text-slate-900">Map</h2>
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    Open full map
                  </a>
                </div>
                <iframe
                  title="Listing location"
                  src={mapEmbedUrl}
                  className="h-[380px] w-full border-0"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Landlord</h2>
              <p className="mt-4 text-lg font-medium text-slate-900">
                {listing.landlordId?.name || "Landlord"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{listing.landlordId?.email || "Email not available"}</p>
              <p className="mt-1 text-sm text-slate-500">{listing.landlordId?.phone || "Phone not available"}</p>

              {contactHref ? (
                <a
                  href={contactHref}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Contact landlord
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
                >
                  Contact info unavailable
                </button>
              )}
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Building</h2>
              <p className="mt-4 text-lg font-medium text-slate-900">
                {listing.buildingId?.name || "Building"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {listing.buildingId?.address || "Address not available"}
              </p>
              <p className="mt-4 text-sm text-slate-600">
                Reviews: {listing.buildingId?.total_reviews ?? 0}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Average rating: {listing.buildingId?.average_rating ?? 0}
              </p>
            </div>
          </aside>
        </section>

        {nearbyListings.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">Nearby Listings</h2>
              <p className="text-sm text-slate-500">Using the dedicated geospatial `/nearby` endpoint.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {nearbyListings.map((nearbyListing) => (
                <NearbyCard key={nearbyListing._id} listing={nearbyListing} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
