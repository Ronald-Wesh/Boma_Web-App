const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatStatusLabel = (status = "available") =>
  status.charAt(0).toUpperCase() + status.slice(1);

export const isValidImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const splitCommaSeparated = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const normalizeListing = (listing) => {
  if (!listing) {
    return null;
  }

  const landlord = listing.landlordId || listing.createdBy || null;
  const building = listing.buildingId || listing.building || null;
  const images = Array.isArray(listing.images)
    ? listing.images.filter(Boolean)
    : listing.image
      ? [listing.image]
      : [];

  return {
    ...listing,
    landlordId: landlord,
    buildingId: building,
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
  };
};

export const getListingCoordinates = (listing) => {
  const coordinates = listing?.location?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return { lng: null, lat: null };
  }

  return {
    lng: coordinates[0],
    lat: coordinates[1],
  };
};

export const buildOpenStreetMapEmbedUrl = (lng, lat, span = 0.01) => {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return "";
  }

  const left = lng - span;
  const right = lng + span;
  const top = lat + span;
  const bottom = lat - span;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
};

export const buildOpenStreetMapLink = (lng, lat) => {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return "#";
  }

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
};

export const fallbackListingImage = FALLBACK_IMAGE;
