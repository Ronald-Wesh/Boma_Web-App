const express = require('express');
const router = express.Router();
const { verifyUser } = require('../Controllers/adminController');
const { protect, isAdmin } = require('../Middleware/authMiddleware');

router.put('/verify-user/:userId', protect, isAdmin, verifyUser);

module.exports = router;

// PUT /api/admin/verify-user/65abc123...
// protect → must be logged in

// isAdmin → must be admin

// verifyUser → performs verification