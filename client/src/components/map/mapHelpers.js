// Map helpers — the single place the GeoJSON ↔ Leaflet coordinate flip happens,
// plus small formatting utilities shared by the map pieces.

// MongoDB/API GeoJSON is [longitude, latitude]; Leaflet wants [latitude, longitude].
export const toLeaflet = (coordinates) =>
  Array.isArray(coordinates) ? [coordinates[1], coordinates[0]] : null;

export const toGeoJSON = ({ lat, lng }) => [lng, lat];

// A listing has real coordinates if it isn't the [0,0] null island.
export const hasRealCoords = (listing) => {
  const c = listing?.location?.coordinates;
  return Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
};

// 8500 → "8.5K", 12000 → "12K", 9600 → "9.6K", 850 → "850".
export const pricePill = (price) => {
  if (price == null || Number.isNaN(price)) return "—";
  if (price < 1000) return String(price);
  const k = price / 1000;
  const rounded = Math.round(k * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}K`;
};

// "KSh 8,500/mo"
export const fullPrice = (price) =>
  price == null ? "KSh —" : `KSh ${price.toLocaleString()}/mo`;

// Uppercase eyebrow label for a listing's area, e.g. "STRATHMORE" or "QWETU HOSTELS".
export const areaLabel = (listing) => {
  const building = listing?.building;
  const label =
    building?.campus?.shortName || building?.name || listing?.address || "";
  return label.toString().toUpperCase();
};

// Leaflet LatLngBounds → the {swLng,swLat,neLng,neLat} shape our API expects.
export const boundsToBox = (bounds) => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return { swLng: sw.lng, swLat: sw.lat, neLng: ne.lng, neLat: ne.lat };
};

// Default map center: Nairobi, zoomed to show the campus cluster.
export const NAIROBI_CENTER = [-1.2833, 36.8167];
export const DEFAULT_ZOOM = 12;
