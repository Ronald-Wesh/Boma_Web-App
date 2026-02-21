const express = require('express');
const router = express.Router();
const {protect}=require("../Middleware/authMiddleware");

const {
    createReview,
    getAllReviews,
    getReviewsByUser,
    getBuildingReviews,
    updateReview,  // ✅ Fixed typo here
    deleteReview,
    markHelpful
} = require("../Controllers/reviewController");

// Create a Review
router.post("/buildings/:buildingId/reviews", protect,createReview);

// Get all reviews
router.get("/reviews", getAllReviews);

// Get reviews for a building
router.get("/buildings/:buildingId/reviews", getBuildingReviews);

// Update a Review
router.put("/reviews/:id", protect, updateReview);  // ✅ Fixed here too

// Delete a Review
router.delete("/reviews/:id", protect, deleteReview);

// Get reviews by a user
router.get("/users/:userId/reviews", getReviewsByUser);

// Mark helpful
router.post("/reviews/:id/helpful", protect, markHelpful);

module.exports = router;