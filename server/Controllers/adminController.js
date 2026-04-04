//Verify User
const User = require("../Models/Users");
const Listing = require("../Models/Listing");

//Finds a user by ID → sets isVerified to true → returns the updated user.
exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: "verified" },
      { new: true },
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User verified successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Unverified Users
exports.getUnverifiedUsers = async (req, res) => {
  try {
    const users = await User.find({
      verificationStatus: { $in: ["pending", "unverified"] },
    }).select("-passwordHash");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Unverified Listings
exports.getUnverifiedListings = async (req, res) => {
  try {
    const listings = await Listing.find({ isVerified: false }).populate(
      "createdBy",
      "name email verificationStatus",
    );
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify A Listing
exports.verifyListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.listingId,
      { isVerified: true },
      { new: true },
    );

    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.status(200).json({ message: "Listing verified successfully", listing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
