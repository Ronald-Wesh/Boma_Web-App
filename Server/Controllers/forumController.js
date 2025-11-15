const ForumPost = require('../models/ForumPost');


exports.createPost = async (req, res) => {
  try {
    const post = new ForumPost({
      building: req.params.buildingId,
      post:req.body.post,
      // posts: [{
      //   user: req.user._id,
      //   content: req.body.content,
      //   isAnonymous: req.body.isAnonymous||true,
      //   resolved: req.body.resolved ||false,
      // }]
    });
    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllForums = async (req, res) => {
  try {
    const posts = await ForumPost.find().populate('user', 'username').populate('building');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPosts = async (req, res) => {
  
  try {
    const posts = await ForumPost.find({ building: req.params.buildingId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString() ) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 