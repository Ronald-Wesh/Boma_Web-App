const express=require("express")
const router=express.Router();
const {protect}=require("../Middleware/authMiddleware");

const {createListing,getAllListings,getListingById,updateListing,deleteListing}=require("../Controllers/listingController")

//Create a new listing
router.post("/",protect,createListing);

//Get All Listings
router.get("/",getAllListings);

//Get a single listing By id
router.get("/:id",getListingById);

//Update a listing
router.put("/:id",protect,updateListing);

//Delete a Listing
router.delete("/:id",protect,deleteListing);

module.exports=router;

