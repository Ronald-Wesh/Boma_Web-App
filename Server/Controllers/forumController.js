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
  try {
    const posts = await ForumPost.find().populate('user', 'username').populate('building');
    res.status(200).json(posts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
