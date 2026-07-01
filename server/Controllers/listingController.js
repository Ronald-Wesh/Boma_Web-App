const Listing = require("../Models/Listing");
const Building = require("../Models/Building");

// Shared filter parsing for the List view and the geo endpoints, so all three
// interpret search/status/verified/roomType/price/amenities/campus identically.
// Async because the campus filter resolves campuses → their buildings first.
async function buildListingFilter(query) {
  const { search, status, verified, roomType, minPrice, maxPrice, amenities, campus } =
    query;
  const filter = {};

  // Text search across title, description, address
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { description: regex }, { address: regex }];
  }

  // Filter by listing status (available/unavailable/pending)
  if (status) filter.status = status;

  // Verified listings only
  if (verified === "true") filter.isVerified = true;

  // Room type(s) — comma-separated list → match any
  if (roomType) {
    const types = roomType.split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length) filter.roomType = { $in: types };
  }

  // Price range (KES / month)
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Amenities — listing must include ALL selected amenities
  if (amenities) {
    const list = amenities.split(",").map((a) => a.trim()).filter(Boolean);
    if (list.length) filter.amenities = { $all: list };
  }

  // Campus — resolve to buildings anchored to those campuses.
  if (campus) {
    const campusIds = campus.split(",").map((c) => c.trim()).filter(Boolean);
    if (campusIds.length) {
      const buildings = await Building.find({
        campus: { $in: campusIds },
      }).select("_id");
      filter.building = { $in: buildings.map((b) => b._id) };
    }
  }

  return filter;
}

// Lightweight marker projection + populate shared by both geo endpoints — enough
// to draw a pin and its preview card, not the full document.
const MARKER_SELECT = "title price roomType isVerified images location address";
const MARKER_POPULATE = {
  path: "building",
  select: "name address campus",
  populate: { path: "campus", select: "shortName name" },
};
const MARKER_LIMIT = 300;

// Parse a query param to a finite number, or null if absent/invalid.
const toFinite = (value) => {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

//Create a new listing
exports.createListing = async (req, res) => {
  try {
    const user = req.user;

    // Ensure the user is authenticated
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      title,
      description,
      price,
      buildingName,
      address,
      features,
      amenities,
      images,
      roomType,
      status,
      location,
      bedrooms,
      bathrooms,
    } = req.body;

    if (!buildingName) {
      return res.status(400).json({ message: "buildingName is required" });
    }

    const hasValidCoordinates =
      location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2 &&
      (location.coordinates[0] !== 0 || location.coordinates[1] !== 0);

    if (!hasValidCoordinates) {
      return res.status(400).json({
        message: "A valid location (coordinates) is required to create a listing",
      });
    }

    // Find existing building or create a new one automatically
    // First try to find by exact name (case insensitive)
    let building = await Building.findOne({
      name: { $regex: new RegExp("^" + buildingName + "$", "i") },
    });

    if (!building) {
      // Create a new building
      building = await Building.create({
        name: buildingName,
        address: address || "Address Not Provided",
        location: location || { type: "Point", coordinates: [0, 0] },
      });
    }

    const listing = await Listing.create({
      title,
      description,
      price,
      bedrooms,
      bathrooms,
      address,
      features,
      images,
      roomType,
      status,
      createdBy: user._id, //From authenticated user
      building: building._id,
      amenities,
      location,
    });

    res.status(201).json({
      listing,
      buildingDetails: {
        _id: building._id,
        name: building.name,
        isNewBuilding:
          !building.createdAt ||
          building.createdAt.getTime() === building.updatedAt.getTime(),
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// const listings = await Listing.find().populate('createdBy', 'name verificationStatus');
// {listing.owner.verificationStatus === "verified" && (
//   <span className="badge">✔ Verified</span>
// )}

//Get all Listings — supports search, status, verified, sort, pagination,
// plus roomType / price range / amenities / campus filters (all additive:
// each only narrows results when its query param is present).
exports.getAllListings = async (req, res) => {
  try {
    const { sort, page = 1, limit = 12 } = req.query;

    // Shared filter parsing (search/status/verified/roomType/price/amenities/campus).
    const filter = await buildListingFilter(req.query);

    // Build sort object
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sort === "price_asc") sortObj = { price: 1 };
    else if (sort === "price_desc") sortObj = { price: -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate("createdBy", "name verificationStatus role")
        .populate({
          path: "building",
          select: "name address average_rating total_reviews campus",
          populate: { path: "campus", select: "name shortName" },
        })
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments(filter),
    ]);

    res.status(200).json({
      listings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Get a single listing by ID — with building (ratings + campus) and landlord,
// everything the detail page needs in one call.
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("createdBy", "name verificationStatus role createdAt avatar")
      .populate({
        path: "building",
        select:
          "name address average_rating total_reviews categoryRatings campus",
        populate: { path: "campus", select: "name shortName location" },
      });
    if (!listing) return res.status(404).json({ message: "Listing Not Found" });
    res.status(200).json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Listings within the current map viewport (primary map fetch).
// GET /api/listings/within?swLng&swLat&neLng&neLat + the shared filters.
exports.getListingsWithin = async (req, res) => {
  try {
    const swLng = toFinite(req.query.swLng);
    const swLat = toFinite(req.query.swLat);
    const neLng = toFinite(req.query.neLng);
    const neLat = toFinite(req.query.neLat);

    if ([swLng, swLat, neLng, neLat].some((n) => n === null)) {
      return res.status(400).json({
        message: "swLng, swLat, neLng, neLat are required numeric bounds",
      });
    }

    const filter = await buildListingFilter(req.query);

    const listings = await Listing.find({
      ...filter,
      location: {
        $geoWithin: { $box: [[swLng, swLat], [neLng, neLat]] },
      },
      // Exclude ungeocoded listings that default to the null island.
      "location.coordinates": { $ne: [0, 0] },
    })
      .select(MARKER_SELECT)
      .populate(MARKER_POPULATE)
      .limit(MARKER_LIMIT);

    res.status(200).json({ listings, count: listings.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Listings near a point (campus-centric default / "homes near X University").
// GET /api/listings/near?lng&lat&radius=2000 (metres) + the shared filters.
exports.getListingsNear = async (req, res) => {
  try {
    const lng = toFinite(req.query.lng);
    const lat = toFinite(req.query.lat);
    const radius = toFinite(req.query.radius) ?? 2000;

    if (lng === null || lat === null) {
      return res
        .status(400)
        .json({ message: "lng and lat are required numeric coordinates" });
    }

    const filter = await buildListingFilter(req.query);

    const listings = await Listing.find({
      ...filter,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
      "location.coordinates": { $ne: [0, 0] },
    })
      .select(MARKER_SELECT)
      .populate(MARKER_POPULATE)
      .limit(MARKER_LIMIT);

    res.status(200).json({ listings, count: listings.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Update a listing
exports.updateListing = async (req, res) => {
  try {
    //Must be logged in
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;

    //Get the listing
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing Not Found" });

    //Must be owner or admin
    const isOwner = listing.createdBy.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden You can only update your own listings" });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    res.status(200).json(updatedListing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Delete a listing
exports.deleteListing = async (req, res) => {
  try {
    //user must be logged in
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    //find listing
    const listing = await Listing.findById(req.params.id);
    if (!listing)
      return res.status(404).json({ message: "Listing /not Found" });

    //Must be owner or admin
    const isOwner = listing.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden You can only delete your own listings" });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Listing Deleted Successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
