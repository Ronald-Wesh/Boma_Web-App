const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const {
  upsertMyProfile,
  getMyProfile,
  deleteMyProfile,
  browseProfiles,
  getMatches,
} = require("../Controllers/roommateController");

// Mounted at /api/roommates

// Browse all roommate seekers (public). Optional ?campus= & ?status= filters.
router.get("/", browseProfiles);

// Current user's own profile + ranked matches (protected).
router.get("/me", protect, getMyProfile);
router.post("/me", protect, upsertMyProfile);
router.delete("/me", protect, deleteMyProfile);
router.get("/matches", protect, getMatches);

module.exports = router;
