const express = require("express");
const {
  register,
  login,
  googleAuth,
  getMe,
} = require("../Controllers/authController");
const { protect } = require("../Middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", protect, getMe);

module.exports = router;
