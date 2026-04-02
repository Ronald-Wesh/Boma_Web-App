const express=require('express');
const router=express.Router();

const {register,login,getMe,getUserProfile}=require("../Controllers/authController");
const {protect}=require("../Middleware/authMiddleware");

//Register User
router.post('/register',register);

//login User
router.post('/login',login);

//Get User Profile
router.get('/get-profile',protect,getUserProfile);

//Get Your Profile
router.get('/me',protect,getMe);

module.exports=router;


