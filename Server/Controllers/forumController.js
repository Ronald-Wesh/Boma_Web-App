const forumPost=require('../Models/ForumPost');

//Create a new forum post
exports.createPost = async (req,res) => {
  try {
    const post = await ForumPost.create({
      building: req.params.buildingId,
      post: req.body.post
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
