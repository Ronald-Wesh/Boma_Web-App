const express=require("express")
const router=express.Router();
const {protect}=require("../Middleware/authMiddleware");

const {createListing,getAllListings,getListingById,getListingsWithin,getListingsNear,updateListing,deleteListing}=require("../Controllers/listingController")

//Create a new listing
router.post("/",protect,createListing);

//Get All Listings
router.get("/",getAllListings);

//Geo reads for the Map View — MUST be before "/:id" or Express treats
//"within"/"near" as an :id and routes them to getListingById.
router.get("/within",getListingsWithin);
router.get("/near",getListingsNear);

//Get a single listing By id
router.get("/:id",getListingById);

//Update a listing
router.put("/:id",protect,updateListing);

//Delete a Listing
router.delete("/:id",protect,deleteListing);

module.exports=router;

