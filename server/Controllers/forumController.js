const ForumPost = require("../Models/ForumPost");

//Create a new forum post
exports.createPost = async (req, res) => {
  try {
    const post = await ForumPost.create({
      user: req.user._id,
      building: req.params.buildingId,
      post: req.body.post,
    });
    const saved = await post.save();
    res.status(201).json(saved);
    // res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Get All forums of a specific building
exports.getAllForums = async (req, res) => {
  try {
    //populate-replaces the buikding and user id with the actual building and user data
    const posts = await ForumPost.find()
      .populate("user", "username")
      .populate("building");
    res.status(200).json(posts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// .find({ ... })
// Finds all posts that match the given condition.
exports.getSpecificBuildingForums = async (req, res) => {
  try {
    const buildingPosts = await ForumPost.find({
      building: req.params.buildingId,
    })
      .populate("user", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(buildingPosts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    //user must be logged in
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    //find post
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post Not Found" });
    //must be owner or admin
    const isOwner = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner || !isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden You can only delete your own posts" });
    }
    await post.deleteOne();
    res.json({ message: "Post Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
