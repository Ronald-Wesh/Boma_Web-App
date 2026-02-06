const ForumPost=require('../Models/ForumPost');

//Create a new forum post
exports.createPost = async (req,res) => {
  try {
    const post = await ForumPost.create({
      building: req.params.buildingId,
      post: req.body.post
    });
    const saved=await post.save();
    res.status(201).json(saved);
    // res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Get All forums of a specific building
exports.getAllForums=async(req,res)=>{
  try {//populate-replaces the buikding and user id with the actual building and user data
    const posts = await ForumPost.find().populate('user', 'username').populate('building');
    res.status(200).json(posts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// .find({ ... })
// Finds all posts that match the given condition.
exports.getSpecificBuildingForums=async(req,res)=>{
  try{
    const buildingPosts=await ForumPost.find({building:req.params.buildingId})
    .populate('user',"username")
    .sort({createdAt:-1});
    res.status(200).json(buildingPosts)
  }catch(err){
    res.status(400).json({message:err.message});
  }
};

exports.deletePost=async(req,res)=>{
  try{
    const post=await ForumPost.findById(req.params.postId);
    if(!post)return res.status(404).json({message:'Post Not Found'});
    if(post.user.toString()!==req.user._id.toString()){
      return res.status(403).json({message:"Not Authrized"});
    }
    await post.deleteOne();
    res.json({message:'Post Deleted Successfully'});
  }catch(err){
    res.status(500).json({message:err.message});
  }
};