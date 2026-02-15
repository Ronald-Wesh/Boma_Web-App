const Listing=require('../Models/Listing');

//Create a new listing
exports.createListing=async(req,res)=>{
    try{
        const user=req.user;

        // Ensure the user is authenticated
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }   

        //const userId=req.user._id;
        const {title,description,price,building,address,features,amenities,location}=req.body;
        const listing=await Listing.create({
            title,
            description,
            price,
            address,
            features,
            createdBy:user._id, //From authenticated user
            building,
            amenities,
            location

        });
        res.status(201).json(listing);     
    }catch(err){
        res.status(400).json({message:err.message});
    }
}

// const listings = await Listing.find().populate('createdBy', 'username isVerified');
// {listing.owner.isVerified && (
//   <span className="badge">✔ Verified</span>
// )}

//Get all Listings
exports.getAllListings=async(req,res)=>{
    try{
        const listings=await Listing.find().populate('createdBy', 'username isVerified');
        res.status(200).json(listings);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Get a single listing by ID
exports.getListingById=async(req,res)=>{
    try{
        const listing=await Listing.findById(req.params.id).populate('createdBy','username isVerified');
        if(!listing) return res.status(404).json({message:"Listing Not Found"});
        res.status(200).json(listing);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Update a listing
exports.updateListing=async(req,res)=>{
  try{
    if(!req.user) return res.status(401).json({message:"Unauthorized"});

    const updatedListing=await Listing.findByIdAndUpdate(req.params.id,req.body,{new:true});
    res.status(200).json(updatedListing);
  }catch(err){
    res.status(400).json({message:err.message});
  }
};

//Delete a listing
exports.deleteListing=async(req,res)=>{
    try{
        if(!req.user) return res.status(401).json({message:"Unauthorized"});

        await Listing.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Listing Deleted Successfully"});

    }catch(err){
        res.status(400).json({message:err.message});
    }
}