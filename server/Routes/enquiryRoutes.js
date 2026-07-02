const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../Middleware/authMiddleware");
const {
  createEnquiry,
  getMyEnquiries,
  updateEnquiryStatus,
} = require("../Controllers/enquiryController");

// Submit an enquiry about a listing — works logged-in or anonymous.
router.post("/listings/:listingId/enquiries", optionalAuth, createEnquiry);

// Landlord inbox.
router.get("/landlord/enquiries", protect, getMyEnquiries);
router.patch("/landlord/enquiries/:id/status", protect, updateEnquiryStatus);

module.exports = router;
