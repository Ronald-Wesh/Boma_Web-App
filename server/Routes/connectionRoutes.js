const express = require("express");
const router = express.Router();
const { protect } = require("../Middleware/authMiddleware");
const {
  createConnection,
  getIncomingConnections,
  respondToConnection,
} = require("../Controllers/connectionController");

// Mounted at /api/connections — all routes require auth.
router.post("/", protect, createConnection);
router.get("/incoming", protect, getIncomingConnections);
router.patch("/:id", protect, respondToConnection);

module.exports = router;
