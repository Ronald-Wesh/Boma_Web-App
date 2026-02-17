const Building = require("../Models/Building");
const Review=require("../Models/Review")

//Create a new review
exports.createReview=async(req,res)=>{
    try{
        const user=req.user;
        //Ensure user is authenticated
        if(!user) return res.status(401).json({message:"Unauthorized"});

        const {buildingId}=req.params;
        const {title,comment,categories}=req.body;
        //const userId=req.user._id;

        //Check if building  exists 
        const building=await Building.findById(buildingId);
        if(!building) return res.status(404).json({message:"Building Not Found"});

        //check if user has already reviewed this building
        const existingReview=await Review.findOne({building:buildingId,reviewer:user._id})
        if(existingReview) return res.status(400).json({message:"You have already reviewed this building"});
        
        const review=await Review.create({
            title,
            comment,
            building:buildingId,
            categories,
            reviewer:user._id
        });
        //Update building's average rating and total reviews
        const reviews=await Review.find({building:buildingId});
        const totalReviews=reviews.length;
        const averageRating={
            cleanliness:reviews.reduce((acc,review)=>acc+review.categories.cleanliness,0)/totalReviews,
            maintenance:reviews.reduce((acc,review)=>acc+review.categories.maintenance,0)/totalReviews,
            amenities:reviews.reduce((acc,review)=>acc+review.categories.amenities,0)/totalReviews,
            security:reviews.reduce((acc,review)=>acc+review.categories.security,0)/totalReviews,
            water_availabilty:reviews.reduce((acc,review)=>acc+review.categories.water_availabilty,0)/totalReviews,
            landlord_reliabilty:reviews.reduce((acc,review)=>acc+review.categories.landlord_reliabilty,0)/totalReviews
        };
        building.averageRating=averageRating;
        building.total_reviews=totalReviews;
        await building.save();
        res.status(201).json(review);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};
//Get all reviews
exports.getAllReviews=async(req,res)=>{
    try{
        const reviews=await Review.find().populate('reviewer','building','username isVerified');
        res.status(200).json(reviews);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Get reviews for a building
exports.getBuildingReviews=async(req,res)=>{
    try{
        const{sort='-createdAt',limit=20,page=1}=req.query;
        const reviews=(await Review.find({building:req.params.buildingId}))
        .populate('reviewer','username isVerified')
        .sort(sort)
        .skip((page-1)*limit)
        .limit(parseInt(limit));

        const totalReviews=await Review.countDocuments({building:req.params.buildingId});
       res.status(200).json({
            reviews,
            pagination: {
                total:totalReviews,
                page: parseInt(page),
                pages: Math.ceil(totalReviews / parseInt(limit))
            }
        });
    }catch(err){
        res.status(400).json({message:err.message});
    }   
};

//Get Reviews By User
exports.getReviewsByUser=async(req,res)=>{
    try{
        const reviews=await Review.find({reviewer:req.params.userId}).populate('building','title location');
        res.status(200).json(reviews);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Update a review
exports.updateReview=async(req,res)=>{
    try{
        const user=req.user;
        if(!user) return res.status(401).json({message:"Unauthorized"});

        const review=await Review.findById(req.params.id);
        if(!review) return res.status(404).json({message:"Review not found"});
        if(review.reviewer.toString()!==user._id.toString()) return res.status(403).json({message:"Forbidden"});

        //const {title,comment,categories,isAnonymous}=req.body;  
        const updatedReview=await Review.findByIdAndUpdate(req.params.id,req.body,{new:true});
        if(!updatedReview) return res.status(404).json({message:"Review not found"});
        res.status(200).json(updatedReview);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};


//Delete a review
exports.deleteReview=async(req,res)=>{
    try{
        const user=req.user;
        if(!user) return res.status(401).json({message:"Unauthorized"});

        //check if review exists and belongs to user
        const review=await Review.findById(req.params.id);
        if(!review) return res.status(404).json({message:"Review not found"});
        if(review.reviewer.toString()!==user._id.toString()) return res.status(403).json({message:"Forbidden"});

        //Delete review and update building's average rating and total reviews      
        const deletedReview=await Review.findByIdAndDelete(req.params.id);
        if(!deletedReview) return res.status(404).json({message:"Review not found"});
        res.status(200).json({message:"Review deleted successfully"});

        //Recalculate building's average rating and total reviews
        const buildingId=deletedReview.building;
        const building=await Building.findById(buildingId);
        const reviews=await Review.find({building:buildingId});
        const totalReviews=reviews.length;
        const averageRating={
            cleanliness:reviews.reduce((acc,review)=>acc+review.categories.cleanliness,0)/totalReviews,
            maintenance:reviews.reduce((acc,review)=>acc+review.categories.maintenance,0)/totalReviews,
            amenities:reviews.reduce((acc,review)=>acc+review.categories.amenities,0)/totalReviews,
            security:reviews.reduce((acc,review)=>acc+review.categories.security,0)/totalReviews,
            water_availabilty:reviews.reduce((acc,review)=>acc+review.categories.water_availabilty,0)/totalReviews,
            landlord_reliabilty:reviews.reduce((acc,review)=>acc+review.categories.landlord_reliabilty,0)/totalReviews
        };
        building.averageRating=averageRating;
        building.total_reviews=totalReviews;
        await building.save();  
    }catch(err){
        res.status(400).json({message:err.message});
    }
};  


// Mark review as helpful
exports.markHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { $inc: { helpful: 1 } },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        
        res.status(200).json(review);
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper function to update building rating
async function updateBuildingRating(buildingId) {
    const stats = await Review.aggregate([
        { $match: { building: mongoose.Types.ObjectId(buildingId) } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    
    if (stats.length > 0) {
        await Building.findByIdAndUpdate(buildingId, {
            average_rating: stats[0].avgRating.toFixed(1),
            total_reviews: stats[0].totalReviews
        });
    } else {
        await Building.findByIdAndUpdate(buildingId, {
            average_rating: 0,
            total_reviews: 0
        });
    }
};
