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

// const listings = await Listing.find().populate('createdBy', 'username isVerified');
// {listing.owner.isVerified && (
//   <span className="badge">✔ Verified</span>
// )}

//Get all Listings
exports.getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate(
      "createdBy",
      "username isVerified",
    );
    res.status(200).json(listings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Get a single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "createdBy",
      "username isVerified",
    );
    if (!listing) return res.status(404).json({ message: "Listing Not Found" });
    res.status(200).json(listing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Update a listing
exports.updateListing = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json(updatedListing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Delete a listing
exports.deleteListing = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Listing Deleted Successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
