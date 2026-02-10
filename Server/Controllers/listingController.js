const Listing=require('../Models/Listing');

//Create a new listing
exports.createListing=async(req,res)=>{
    try{
        const user=req.user;

        // Ensure the user is authenticated
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }   

        const userId=req.user._id;
        const buildingId=req.params.buildingId;
        const {title,description,price,building,address,createdBy}=req.body;
        const listing=await Listing.create({
            // user:userId,
            title,
            description,
            price,
            building,
            address,
            createdBy:user.username,
            i
        });
        const savedListing=await listing.save();
        res.status(201).json(savedListing);     
    }catch(err){
        res.status(400).json({message:err.message});
    }
}

// const listings = await Listing.find().populate('owner', 'username isVerified');
// {listing.owner.isVerified && (
//   <span className="badge">✔ Verified</span>
// )}

