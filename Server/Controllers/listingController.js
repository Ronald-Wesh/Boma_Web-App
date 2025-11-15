// server/controllers/listingController.js
const Listing = require('../models/Listing');



// Create new listing
exports.createListing = async (req, res) => {
  try {
    const user=req.user;//Comes from authmiddleware

    //check if the user is a  verified Landlord
    const isVerifiedLandlord=
    user.role==="landlord" && 
    user.verified && 
    user.verification_status === "verified";

    const { title, description, price, building,address ,createdBy} = req.body;
    const newListing = new Listing({
      // ...req.body,
      // landlord: req.user.id // assuming auth middleware sets req.user
      title,
      description,
      price,
      building,
      address,
      createdBy:req.user._id,
      verifiedListing:isVerifiedLandlord ? true : false, // add badge flag
      //isVerified:req.user.isVerified,
    });
    const saved = await newListing.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};


// Get all listings
exports.getAllListings = async (req, res) => {
  try {
//     place the landlord field (which is typically just an ID) in each listing with the actual User document it references.

// But only include the name and verifiedLandlord fields from the User (landlord) document.
    const listings = await Listing.find().populate("createdBy", "username role");
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("createdBy", "username role");
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Update listing
exports.updateListing = async (req, res) => {
  try {
    if (listing.createdBy.toString() !== req.user._id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Listing not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const deleted = await Listing.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};