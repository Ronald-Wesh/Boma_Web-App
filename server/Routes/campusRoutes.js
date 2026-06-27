const express = require("express");
const router = express.Router();
const {
  getAllCampuses,
  getCampusById,
  getCampusBuildings,
} = require("../Controllers/campusController");

// Mounted at /api/campuses — all public (browsing is open per blueprint).
router.get("/", getAllCampuses);
router.get("/:campusId", getCampusById);
router.get("/:campusId/buildings", getCampusBuildings);

module.exports = router;
