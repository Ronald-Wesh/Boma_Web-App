// Shared helpers for the listing detail view.

export const ROOM_LABEL = {
  bedsitter: "Bedsitter",
  single_room: "Single Room",
  shared_room: "Shared Room",
  studio: "Studio",
  one_bedroom: "One Bedroom",
  two_bedroom: "Two Bedroom",
  other: "Room",
};

// Great-circle distance in km between two GeoJSON [lng, lat] points.
export function haversineKm(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  if ([lng1, lat1, lng2, lat2].some((n) => typeof n !== "number")) return null;
  // Ignore the seed's default [0,0] placeholders.
  if ((lng1 === 0 && lat1 === 0) || (lng2 === 0 && lat2 === 0)) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Average of the present category ratings (1–5).
export function categoryAverage(categories) {
  if (!categories) return 0;
  const values = Object.values(categories).filter(
    (v) => typeof v === "number" && v > 0,
  );
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// "SEPTEMBER 2024"
export function monthYear(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

export function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
