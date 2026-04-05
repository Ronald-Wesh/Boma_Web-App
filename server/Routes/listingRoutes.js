const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");

const {
  createListing,
  getAllListings,
  getNearbyListings,
  getListingById,
  updateListing,
  deleteListing,
} = require("../Controllers/listingController");

router.get("/", getAllListings);
router.get("/nearby", getNearbyListings);
router.get("/:id", getListingById);
router.post("/", protect, createListing);
router.put("/:id", protect, updateListing);
router.delete("/:id", protect, deleteListing);

module.exports = router;
