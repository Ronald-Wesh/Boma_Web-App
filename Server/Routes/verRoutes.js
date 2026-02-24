//Used by admin/verifier to view requests & verify landlords
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { protect} = require('../middleware/authMiddleware');
const isVerifier=require("../middleware/verifier")