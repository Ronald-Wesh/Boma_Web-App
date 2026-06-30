const express = require("express");
const router = express.Router();
const buildingController = require("../Controllers/buildingController");

// Mounted at /api/buildings
// List all buildings (used by forum/review composers)
router.get("/", buildingController.getAllBuildings);

// Building listings and insights
router.get("/:buildingId/listings", buildingController.getBuildingListings);
router.get("/:buildingId/insights", buildingController.getBuildingInsights);
router.get("/:buildingId/nearby", buildingController.getNearbyBuildings);

// NOTE: review routes live in reviewRoutes.js (mounted at /api) to avoid duplicate handlers.

module.exports = router;
