// Filter vocabularies for the Browse Listings page. These MUST match the
// backend enum (Listing.roomType) and the seeded amenity strings so that
// server-side filtering actually returns results.

export const ROOM_TYPE_OPTIONS = [
  { value: "bedsitter", label: "Bedsitter" },
  { value: "single_room", label: "Single Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "One Bedroom" },
  { value: "two_bedroom", label: "Two Bedroom" },
];

// Exact strings stored on Listing.amenities by the seeder.
export const AMENITY_OPTIONS = [
  "Borehole water",
  "CCTV",
  "Security guard",
  "Parking",
  "Gym",
  "Laundry",
  "Study room",
  "Cafeteria",
];

export const BUDGET = {
  min: 5000,
  max: 35000,
  step: 500,
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];
