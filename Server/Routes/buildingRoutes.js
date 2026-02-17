const express = require('express');
const router = express.Router();
const buildingController = require('../Controllers/buildingController');
const reviewController = require('../Controllers/reviewController');
const {protect} = require('../Middleware/authMiddleware');

// Building CRUD
router.post('/', protect, buildingController.createBuilding);
router.get('/', buildingController.getAllBuildings);
router.get('/:buildingId', buildingController.getBuildingByID);
router.put('/:buildingId', protect, buildingController.updateBuilding);
router.delete('/:buildingId', protect, buildingController.deleteBuilding);

// Building listings and insights
router.get('/:buildingId/listings', buildingController.getBuildingListings);
router.get('/:buildingId/insights', buildingController.getBuildingInsights);
router.get('/:buildingId/nearby', buildingController.getNearbyBuildings);

// Reviews
router.post('/:buildingId/reviews', protect, reviewController.createReview);
router.get('/:buildingId/reviews', reviewController.getBuildingReviews);
router.put('/reviews/:reviewId', protect, reviewController.updateReview);
router.delete('/reviews/:reviewId', protect, reviewController.deleteReview);
router.patch('/reviews/:reviewId/helpful', reviewController.markHelpful);

module.exports = router;
