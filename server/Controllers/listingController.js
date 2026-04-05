const mongoose = require("mongoose");
const Listing = require("../Models/Listing");
const Building = require("../Models/Building");

const VALID_STATUS = new Set(["available", "unavailable", "pending"]);
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const LISTING_POPULATION = [
  {
    path: "landlordId",
    select: "name email phone role avatar verificationStatus createdAt",
  },
  {
    path: "buildingId",
    select: "name address location average_rating total_reviews",
  },
];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const hasNumberValue = (value) => value !== null && !Number.isNaN(value);

const sanitizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const isValidImageUrl = (value) => {
  if (!isNonEmptyString(value)) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const parseLocationInput = (body, { partial = false } = {}) => {
  const hasLocationObject = body.location !== undefined;
  const hasCoordinateInputs = body.lng !== undefined || body.lat !== undefined;

  if (!hasLocationObject && !hasCoordinateInputs) {
    return partial ? { value: undefined } : { error: "location is required" };
  }

  let locationType = "Point";
  let coordinates;

  if (hasLocationObject && typeof body.location === "object" && body.location !== null) {
    locationType = body.location.type || "Point";
    coordinates = body.location.coordinates;
  } else {
    const lng = toNumber(body.lng);
    const lat = toNumber(body.lat);
    coordinates = [lng, lat];
  }

  if (locationType !== "Point") {
    return { error: "location.type must be Point" };
  }

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return { error: "location.coordinates must be [lng, lat]" };
  }

  const lng = toNumber(coordinates[0]);
  const lat = toNumber(coordinates[1]);

  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return { error: "location coordinates must be valid numbers" };
  }

  if (lng === null || lat === null) {
    return { error: "location.coordinates must include both lng and lat" };
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return {
      error:
        "location.coordinates must be [lng, lat] within valid longitude/latitude ranges",
    };
  }

  return {
    value: {
      type: "Point",
      coordinates: [lng, lat],
    },
  };
};

const normalizeListingPayload = async (body, { partial = false } = {}) => {
  const payload = {};

  if (!partial || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) {
      return { error: "title is required" };
    }

    payload.title = body.title.trim();
  }

  if (!partial || body.description !== undefined) {
    if (!isNonEmptyString(body.description)) {
      return { error: "description is required" };
    }

    payload.description = body.description.trim();
  }

  if (!partial || body.price !== undefined) {
    const price = toNumber(body.price);
    if (price === null || Number.isNaN(price) || price < 0) {
      return { error: "price must be a number greater than or equal to 0" };
    }

    payload.price = price;
  }

  if (!partial || body.bedrooms !== undefined) {
    const bedrooms = toNumber(body.bedrooms);
    if (bedrooms === null || Number.isNaN(bedrooms) || bedrooms < 0) {
      return { error: "bedrooms must be a number greater than or equal to 0" };
    }

    payload.bedrooms = bedrooms;
  }

  if (!partial || body.bathrooms !== undefined) {
    const bathrooms = toNumber(body.bathrooms);
    if (bathrooms === null || Number.isNaN(bathrooms) || bathrooms < 0) {
      return { error: "bathrooms must be a number greater than or equal to 0" };
    }

    payload.bathrooms = bathrooms;
  }

  if (!partial || body.status !== undefined) {
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!VALID_STATUS.has(status)) {
      return { error: "status must be available, unavailable, or pending" };
    }

    payload.status = status;
  }

  if (!partial || body.amenities !== undefined) {
    payload.amenities = sanitizeStringArray(body.amenities);
  }

  if (!partial || body.features !== undefined) {
    payload.features = sanitizeStringArray(body.features);
  }

  if (!partial || body.images !== undefined) {
    const images = sanitizeStringArray(body.images);
    if (images.some((image) => !isValidImageUrl(image))) {
      return { error: "images must contain only valid http/https URLs" };
    }

    payload.images = images;
  }

  if (!partial || body.buildingId !== undefined) {
    if (!isNonEmptyString(body.buildingId)) {
      return { error: "buildingId is required" };
    }

    if (!mongoose.Types.ObjectId.isValid(body.buildingId)) {
      return { error: "buildingId must be a valid MongoDB ObjectId" };
    }

    const building = await Building.findById(body.buildingId);
    if (!building) {
      return { error: "Referenced building was not found" };
    }

    payload.buildingId = building._id;
  }

  const parsedLocation = parseLocationInput(body, { partial });
  if (parsedLocation.error) {
    return { error: parsedLocation.error };
  }

  if (parsedLocation.value) {
    payload.location = parsedLocation.value;
  }

  return { value: payload };
};

const buildListFilter = (query) => {
  const filter = {};

  if (isNonEmptyString(query.search)) {
    const regex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { amenities: regex },
      { features: regex },
    ];
  }

  if (isNonEmptyString(query.status) && VALID_STATUS.has(query.status.trim())) {
    filter.status = query.status.trim();
  }

  if (query.verified === "true") {
    filter.isVerified = true;
  }

  const minPrice = toNumber(query.minPrice ?? query.priceMin);
  const maxPrice = toNumber(query.maxPrice ?? query.priceMax);

  if (hasNumberValue(minPrice) || hasNumberValue(maxPrice)) {
    filter.price = {};

    if (hasNumberValue(minPrice)) {
      filter.price.$gte = minPrice;
    }

    if (hasNumberValue(maxPrice)) {
      filter.price.$lte = maxPrice;
    }
  }

  const bedrooms = toNumber(query.bedrooms);
  if (hasNumberValue(bedrooms)) {
    filter.bedrooms = { $gte: bedrooms };
  }

  const bathrooms = toNumber(query.bathrooms);
  if (hasNumberValue(bathrooms)) {
    filter.bathrooms = { $gte: bathrooms };
  }

  if (
    mongoose.Types.ObjectId.isValid(query.buildingId) &&
    isNonEmptyString(query.buildingId)
  ) {
    filter.buildingId = query.buildingId.trim();
  }

  if (
    mongoose.Types.ObjectId.isValid(query.landlordId) &&
    isNonEmptyString(query.landlordId)
  ) {
    filter.landlordId = query.landlordId.trim();
  }

  const lng = toNumber(query.lng);
  const lat = toNumber(query.lat);
  const maxDistance = toNumber(query.maxDistance);

  if (hasNumberValue(lng) && hasNumberValue(lat)) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        ...(hasNumberValue(maxDistance) && maxDistance >= 0
          ? { $maxDistance: maxDistance }
          : {}),
      },
    };
  }

  return filter;
};

const buildSort = (sort) => {
  if (sort === "price_asc") {
    return { price: 1, createdAt: -1 };
  }

  if (sort === "price_desc") {
    return { price: -1, createdAt: -1 };
  }

  if (sort === "oldest") {
    return { createdAt: 1 };
  }

  return { createdAt: -1 };
};

const populateListingQuery = (query) => {
  let populated = query;

  for (const config of LISTING_POPULATION) {
    populated = populated.populate(config);
  }

  return populated;
};

const canManageListing = (user, listing) =>
  user?.role === "admin" ||
  listing.landlordId.toString() === user?._id?.toString();

exports.createListing = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "landlord") {
      return res.status(403).json({
        message: "Only landlords can create listings",
      });
    }

    const normalized = await normalizeListingPayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const listing = await Listing.create({
      ...normalized.value,
      landlordId: req.user._id,
    });

    const populatedListing = await populateListingQuery(
      Listing.findById(listing._id),
    );

    return res.status(201).json({ listing: populatedListing });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * limit;
    const filter = buildListFilter(req.query);
    const sort = buildSort(req.query.sort);

    const [listings, total] = await Promise.all([
      populateListingQuery(
        Listing.find(filter).sort(sort).skip(skip).limit(limit),
      ),
      Listing.countDocuments(filter),
    ]);

    return res.status(200).json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + listings.length < total,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getNearbyListings = async (req, res) => {
  try {
    const lng = toNumber(req.query.lng);
    const lat = toNumber(req.query.lat);
    const maxDistance = toNumber(req.query.maxDistance);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE),
    );

    if (!hasNumberValue(lng) || !hasNumberValue(lat)) {
      return res.status(400).json({
        message: "lng and lat query params are required numbers",
      });
    }

    const listings = await populateListingQuery(
      Listing.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance:
              hasNumberValue(maxDistance) && maxDistance >= 0 ? maxDistance : 5000,
          },
        },
      }).limit(limit),
    );

    return res.status(200).json({
      listings,
      count: listings.length,
      query: {
        lng,
        lat,
        maxDistance:
          hasNumberValue(maxDistance) && maxDistance >= 0 ? maxDistance : 5000,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await populateListingQuery(Listing.findById(req.params.id));

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.status(200).json({ listing });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!canManageListing(req.user, listing)) {
      return res.status(403).json({
        message: "Only the owner or an admin can update this listing",
      });
    }

    const normalized = await normalizeListingPayload(req.body, { partial: true });
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    Object.assign(listing, normalized.value);
    const updatedListing = await listing.save();
    const populatedListing = await populateListingQuery(
      Listing.findById(updatedListing._id),
    );

    return res.status(200).json({ listing: populatedListing });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (!canManageListing(req.user, listing)) {
      return res.status(403).json({
        message: "Only the owner or an admin can delete this listing",
      });
    }

    await listing.deleteOne();

    return res.status(200).json({ message: "Listing deleted successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};


// const Listing = require("../Models/Listing");
// const Building = require("../Models/Building");

// //Create a new listing
// exports.createListing = async (req, res) => {
//   try {
//     const user = req.user;

//     // Ensure the user is authenticated
//     if (!user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const {
//       title,
//       description,
//       price,
//       buildingName,
//       address,
//       features,
//       amenities,
//       location,
//       bedrooms,
//       bathrooms,
//     } = req.body;

//     if (!buildingName) {
//       return res.status(400).json({ message: "buildingName is required" });
//     }

//     // Find existing building or create a new one automatically
//     // First try to find by exact name (case insensitive)
//     let building = await Building.findOne({
//       name: { $regex: new RegExp("^" + buildingName + "$", "i") },
//     });

//     if (!building) {
//       // Create a new building
//       building = await Building.create({
//         name: buildingName,
//         address: address || "Address Not Provided",
//         location: location || { type: "Point", coordinates: [0, 0] },
//       });
//     }

//     const listing = await Listing.create({
//       title,
//       description,
//       price,
//       bedrooms,
//       bathrooms,
//       address,
//       features,
//       createdBy: user._id, //From authenticated user
//       building: building._id,
//       amenities,
//       location,
//     });

//     res.status(201).json({
//       listing,
//       buildingDetails: {
//         _id: building._id,
//         name: building.name,
//         isNewBuilding:
//           !building.createdAt ||
//           building.createdAt.getTime() === building.updatedAt.getTime(),
//       },
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // const listings = await Listing.find().populate('createdBy', 'name verificationStatus');
// // {listing.owner.verificationStatus === "verified" && (
// //   <span className="badge">✔ Verified</span>
// // )}

// //Get all Listings — supports search, status, verified, sort, pagination
// exports.getAllListings = async (req, res) => {
//   try {
//     const { search, status, verified, sort, page = 1, limit = 12 } = req.query;

//     // Build dynamic filter object
//     const filter = {};

//     // Text search across title, description, address
//     if (search) {
//       const regex = new RegExp(search, "i");
//       filter.$or = [
//         { title: regex },
//         { description: regex },
//         { address: regex },
//       ];
//     }

//     // Filter by listing status (available/unavailable/pending)
//     if (status) {
//       filter.status = status;
//     }

//     // Filter verified listings only
//     if (verified === "true") {
//       filter.isVerified = true;
//     }

//     // Build sort object
//     let sortObj = { createdAt: -1 }; // default: newest first
//     if (sort === "price_asc") sortObj = { price: 1 };
//     else if (sort === "price_desc") sortObj = { price: -1 };
//     else if (sort === "newest") sortObj = { createdAt: -1 };

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [listings, total] = await Promise.all([
//       Listing.find(filter)
//         .populate("createdBy", "name verificationStatus role")
//         .populate("building", "name address average_rating total_reviews")
//         .sort(sortObj)
//         .skip(skip)
//         .limit(parseInt(limit)),
//       Listing.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       listings,
//       total,
//       page: parseInt(page),
//       totalPages: Math.ceil(total / parseInt(limit)),
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// //Get a single listing by ID
// exports.getListingById = async (req, res) => {
//   try {
//     const listing = await Listing.findById(req.params.id).populate(
//       "createdBy",
//       "name verificationStatus",
//     );
//     if (!listing) return res.status(404).json({ message: "Listing Not Found" });
//     res.status(200).json(listing);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// //Update a listing
// exports.updateListing = async (req, res) => {
//   try {
//     //Must be logged in
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     const user = req.user;

//     //Get the listing
//     const listing=await Listing.findById(req.params.id);
//     if(!listing) return res.status(404).json({message:"Listing Not Found"})

//     //Must be owner or admin
//     const isOwner=listing.createdBy.toString()===user._id.toString()
//     const isAdmin=user.role==="admin"
//     if(!isOwner && !isAdmin){
//       return res.status(403).json({message:"Forbidden You can only update your own listings"})
//     }

//     const updatedListing = await Listing.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true ,runValidators:true},
//     );
//     res.status(200).json(updatedListing);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// //Delete a listing
// exports.deleteListing = async (req, res) => {
//   try {
//     //user must be logged in
//     if (!req.user) return res.status(401).json({ message: "Unauthorized" });
//     //find listing
//     const listing=await Listing.findById(req.params.id);
//     if(!listing) return res.status(404).json({message:"Listing /not Found"});

//     //Must be owner or admin
//     const isOwner=listing.createdBy.toString()===req.user._id.toString();
//     const isAdmin=req.user.role==="admin";
//     if(!isOwner && !isAdmin){
//       return res.status(403).json({message:"Forbidden You can only delete your own listings"});
//     }


//     await Listing.findByIdAndDelete(req.params.id);
//     res.status(200).json({ message: "Listing Deleted Successfully" });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };
