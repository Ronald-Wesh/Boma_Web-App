const Listing = require("../Models/Listing");
const Building = require("../Models/Building");

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
    const {
      search,
      status,
      verified,
      sort,
      page = 1,
      limit = 12,
      roomType,
      minPrice,
      maxPrice,
      amenities,
      campus,
    } = req.query;

    // Build dynamic filter object
    const filter = {};

    // Text search across title, description, address
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { address: regex },
      ];
    }

    // Filter by listing status (available/unavailable/pending)
    if (status) {
      filter.status = status;
    }

    // Filter verified listings only
    if (verified === "true") {
      filter.isVerified = true;
    }

    // Room type(s) — comma-separated list → match any
    if (roomType) {
      const types = roomType
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
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
      const list = amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (list.length) filter.amenities = { $all: list };
    }

    // Campus — resolve to the buildings anchored to those campuses,
    // then restrict listings to those buildings.
    if (campus) {
      const campusIds = campus
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (campusIds.length) {
        const buildings = await Building.find({
          campus: { $in: campusIds },
        }).select("_id");
        filter.building = { $in: buildings.map((b) => b._id) };
      }
    }

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
