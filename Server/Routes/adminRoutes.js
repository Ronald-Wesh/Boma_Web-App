const express = require("express");
const router = express.Router();
const {
  verifyUser,
  getUnverifiedUsers,
  getUnverifiedListings,
  verifyListing,
} = require("../Controllers/adminController");
const { protect, isAdmin } = require("../Middleware/authMiddleware");

// User routes
router.get("/unverified-users", protect, isAdmin, getUnverifiedUsers);
router.patch("/verify-user/:userId", protect, isAdmin, verifyUser);

// Listing routes
router.get("/unverified-listings", protect, isAdmin, getUnverifiedListings);
router.patch("/verify-listing/:listingId", protect, isAdmin, verifyListing);

module.exports = router;

// verifyUser → performs verification
