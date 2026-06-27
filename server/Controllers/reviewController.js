const Building = require("../Models/Building");
const Review = require("../Models/Review");
const mongoose = require("mongoose");

//Create a new review
exports.createReview = async (req, res) => {
  try {
    const user = req.user;
    //Ensure user is authenticated
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { buildingId } = req.params;
    const { title, comment, categories } = req.body;
    //const userId=req.user._id;

    //Check if building  exists
    const building = await Building.findById(buildingId);
    if (!building)
      return res.status(404).json({ message: "Building Not Found" });

    //check if user has already reviewed this building
    const existingReview = await Review.findOne({
      building: buildingId,
      reviewer: user._id,
    });
    if (existingReview)
      return res
        .status(400)
        .json({ message: "You have already reviewed this building" });

    const review = await Review.create({
      title,
      comment,
      building: buildingId,
      categories,
      reviewer: user._id,
    });
    //Update building's average rating and total reviews
    await updateBuildingRating(buildingId);

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
//Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("reviewer", "name verificationStatus")
      .populate("building", "name address");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Get reviews for a building
exports.getBuildingReviews = async (req, res) => {
  try {
    const { sort = "-createdAt", limit = 20, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filter = { building: req.params.buildingId };

    const reviews = await Review.find(filter)
      .populate("reviewer", "name verificationStatus")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(filter);

    res.status(200).json({
      reviews,
      pagination: {
        total: totalReviews,
        page: pageNum,
        pages: Math.ceil(totalReviews / limitNum),
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Get Reviews By User
exports.getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.params.userId }).populate(
      "building",
      "title location",
    );
    res.status(200).json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Update a review
exports.updateReview = async (req, res) => {
  try {
    //must be logged in
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    //find review
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    //must be owner or admin
    const isOwner = review.reviewer.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    //const {title,comment,categories,isAnonymous}=req.body;
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedReview)
      return res.status(404).json({ message: "Review not found" });

    //Recalculate building's average rating and total reviews
    await updateBuildingRating(updatedReview.building);

    res.status(200).json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Delete a review
exports.deleteReview = async (req, res) => {
  try {
    //must be logged in
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    //check if review exists and belongs to user
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    //must be owner or admin
    const isOwner = review.reviewer.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Forbidden" });

    //Delete review and update building's average rating and total reviews
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview)
      return res.status(404).json({ message: "Review not found" });

    //Recalculate building's average rating and total reviews
    await updateBuildingRating(deletedReview.building);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true },
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
    { $match: { building: new mongoose.Types.ObjectId(buildingId) } },
    {
      $group: {
        _id: "$building",
        totalReviews: { $sum: 1 },
        avgCleanliness: { $avg: "$categories.cleanliness" },
        avgMaintenance: { $avg: "$categories.maintenance" },
        avgAmenities: { $avg: "$categories.amenities" },
        avgSecurity: { $avg: "$categories.security" },
        avgWater: { $avg: "$categories.water_availability" },
        avgLandlord: { $avg: "$categories.landlord_reliability" },
      },
    },
  ]);

  const emptyCategories = {
    cleanliness: 0,
    maintenance: 0,
    amenities: 0,
    security: 0,
    water_availability: 0,
    landlord_reliability: 0,
  };

  if (stats.length > 0) {
    const s = stats[0];
    const categoryRatings = {
      cleanliness: s.avgCleanliness || 0,
      maintenance: s.avgMaintenance || 0,
      amenities: s.avgAmenities || 0,
      security: s.avgSecurity || 0,
      water_availability: s.avgWater || 0,
      landlord_reliability: s.avgLandlord || 0,
    };

    // Overall building rating = mean of the category averages (a single Number for cards)
    const values = Object.values(categoryRatings);
    const overall = values.reduce((sum, v) => sum + v, 0) / values.length;

    await Building.findByIdAndUpdate(buildingId, {
      total_reviews: s.totalReviews,
      average_rating: Number(overall.toFixed(2)),
      categoryRatings,
    });
  } else {
    await Building.findByIdAndUpdate(buildingId, {
      total_reviews: 0,
      average_rating: 0,
      categoryRatings: emptyCategories,
    });
  }
}
