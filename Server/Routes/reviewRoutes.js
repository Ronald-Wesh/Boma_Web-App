const express=require('express')
const router=express.Router();
const protect=require("../middleware/authMiddleware")

const {createReview,getAllReviews,getUserReviews,getBuildingReviews,updatReview,deleteReview,markHelpful}=require("../Controllers/reviewController")

//Crate a Review
router.post("/buildings/:buildngId/reviews",protect,createReview);

//Get all reviews
router.get("/reviews",getAllReviews);

//Get reviews For a building
router.get("/buildings/:buildingId/reviews",getBuildingReviews);

//Update a Review
router.put("/reviews/:id",protect,updatReview);

//Delete a Review
router.delete("/reviews/:id",protect,deleteReview);

//Get reviews by a user
router.get("/users/:userId/reviews",getUserReviews);

//mark helpful
router.post("/reviews/:id/helpful",protect,markHelpful);

module.exports=router;