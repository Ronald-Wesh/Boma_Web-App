const Building=require('../Models/Building');
const Review=require('../Models/Review');
const Listing=require('../Models/Listing');

//Get All Listings for a building
exports.getBuildingListings=async(req,res)=>{
    try{
        //Check if building exists
        const building=await Building.findById(req.params.buildingId);
        if(!building) return res.status(404).json({message:"Building Not Found"});  

        //const {buildingId}=req.params;
        const listings=await Listing.find({building:req.params.buildingId})
        .populate('createdBy','username email isVerified')
        .sort({createdAt:-1})
        ;
        res.status(200).json({building:{
            _id:building._id,
            name:building.name,
            location:building.location,
            address:building.address,
            averageRating:building.averageRating,
            total_reviews:building.total_reviews

        },
        totalListings:listings.length,
        listings:listings
        }

        );
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Get All Reviews for a building
exports.getBuildingReviews=async(req,res)=>{
    try{
        const reviews=await Review.find({building:req.params.buildingId}).populate('reviewer','username isVerified');
        res.status(200).json(reviews);
    }catch(err){
        res.status(400).json({message:err.message});
    }   
};  


// Get building statistics and insights
exports.getBuildingInsights = async (req, res) => {
    try {
        const { buildingId } = req.params;
        
        const building = await Building.findById(buildingId);
        if (!building) {
            return res.status(404).json({ message: "Building not found" });
        }
        
        // Get all listings in the building
        const listings = await Listing.find({ building: buildingId });
        
        // Calculate price statistics
        const prices = listings.map(l => l.price);
        const priceStats = {
            min: Math.min(...prices) || 0,
            max: Math.max(...prices) || 0,
            average: prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : 0,
            median: prices.length ? calculateMedian(prices) : 0
        };
        
        // Get availability count
        const availableListings = listings.filter(l => l.status === 'available').length;
        
        // Get reviews for the building
        const reviews = await Review.find({ building: buildingId })
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Calculate rating breakdown
        const ratingBreakdown = await Review.aggregate([
            { $match: { building: mongoose.Types.ObjectId(buildingId) } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);
        
        res.status(200).json({
            building: {
                _id: building._id,
                name: building.name,
                address: building.address,
                location: building.location,
                average_rating: building.average_rating,
                total_reviews: building.total_reviews
            },
            statistics: {
                totalListings: listings.length,
                availableListings: availableListings,
                occupancyRate: listings.length ? ((listings.length - availableListings) / listings.length * 100).toFixed(1) : 0,
                priceRange: priceStats
            },
            ratingBreakdown: ratingBreakdown,
            recentReviews: reviews
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper function for median calculation
function calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Get buildings nearby with comparison
exports.getNearbyBuildings = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const { maxDistance = 5000 } = req.query; // 5km default
        
        const building = await Building.findById(buildingId);
        if (!building) {
            return res.status(404).json({ message: "Building not found" });
        }
        
        // Find nearby buildings using geospatial query
        const nearbyBuildings = await Building.find({
            _id: { $ne: buildingId },
            location: {
                $near: {
                    $geometry: building.location,
                    $maxDistance: parseInt(maxDistance)
                }
            }
        }).limit(5);
        
        // Get listing counts for each building
        const buildingsWithStats = await Promise.all(
            nearbyBuildings.map(async (b) => {
                const listingCount = await Listing.countDocuments({ building: b._id });
                const avgPrice = await Listing.aggregate([
                    { $match: { building: b._id } },
                    { $group: { _id: null, avgPrice: { $avg: '$price' } } }
                ]);
                
                return {
                    _id: b._id,
                    name: b.name,
                    address: b.address,
                    average_rating: b.average_rating,
                    total_reviews: b.total_reviews,
                    totalListings: listingCount,
                    averagePrice: avgPrice[0]?.avgPrice?.toFixed(2) || 0,
                    distance: calculateDistance(building.location.coordinates, b.location.coordinates)
                };
            })
        );
        
        res.status(200).json({
            currentBuilding: {
                _id: building._id,
                name: building.name,
                address: building.address
            },
            nearbyBuildings: buildingsWithStats
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper function to calculate distance
function calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(2) + ' km';
}

// //Create a new building
// exports.createBuilding=async(req,res)=>{
//     try{
//         const {name,location,address}=req.body;
//         const building=await Building.create({
//             name,
//             location,
//             address
//         });
//         const savedBuilding=await building.save();
//         res.status(201).json(savedBuilding);
//     }catch(err){
//         res.status(400).json({message:err.message});
//     }
// };

//Get all buildings
// exports.getAllBuildings=async(req,res)=>{
//     try{
//         const buildings=await Building.find();
//         res.status(200).json(buildings)
//     }catch(err){
//     res.status(400).json({message:err.message});
// }
// };

// //Get a specific building by ID
// exports.getBuildingByID=async(req,res)=>{
//     try{
//         const building=await Building.findById(req.params.buildingId);
//         if(!building) return res.status(404).json({message:"Building Not Found"});
//         res.json(building);
//     }catch(err){
//         res.status(400).json({message:err.message});
//     }
// };

// //Update a building by ID
// exports.updateBuilding=async(req,res)=>{
//     try{
//         const building=await Building.findByIdAndUpdate(
//             req.params.buildingId,
//             req.body,
//             {new:true});
//         if(!building) return res.status(404).json({message:"Building Not Found"});
//         res.json(building);
//     }catch(err){
//         res.status(400).json({message:err.message});
//     }
// }

// //Delete a building by ID
// exports.deleteBuilding=async(req,res)=>{
//     try{
//         const building=await Building.findByIdAndDelete(req.params.buildingId);
//         if(!building) return res.status(404).json({message:"Building Not Found"});
//         res.json({message:"Building deleted successfully"});
//     }catch(err){
//         res.status(400).json({message:err.message});
//     }
// }