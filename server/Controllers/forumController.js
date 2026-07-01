const ForumPost = require("../Models/ForumPost");
const ForumComment = require("../Models/ForumComment");

// Locate the parent doc + entry subdoc for a given entry id.
async function findEntry(entryId) {
  const doc = await ForumPost.findOne({ "post._id": entryId });
  if (!doc) return {};
  return { doc, entry: doc.post.id(entryId) };
}

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
      .populate("user", "name")
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
      .populate("user", "name")
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
    if (!isOwner && !isAdmin) {
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

// Toggle an up/down vote on a thread entry. body: { direction: "up" | "down" }
exports.voteEntry = async (req, res) => {
  try {
    const value = req.body.direction === "up" ? 1 : -1;
    const { doc, entry } = await findEntry(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Post not found" });

    const uid = req.user._id.toString();
    const existing = entry.voters.find((v) => v.user.toString() === uid);
    if (!existing) {
      entry.voters.push({ user: req.user._id, value });
    } else if (existing.value === value) {
      entry.voters.pull(existing._id); // same vote → toggle off
    } else {
      existing.value = value; // switch direction
    }

    entry.upvotes = entry.voters.filter((v) => v.value === 1).length;
    entry.downvotes = entry.voters.filter((v) => v.value === -1).length;
    await doc.save();

    const myVote = entry.voters.find((v) => v.user.toString() === uid)?.value || 0;
    res.status(200).json({
      upvotes: entry.upvotes,
      downvotes: entry.downvotes,
      myVote,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// List comments for a thread entry.
exports.getComments = async (req, res) => {
  try {
    const comments = await ForumComment.find({ entry: req.params.entryId })
      .populate("user", "name")
      .sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add a comment to a thread entry. body: { content, isAnonymous }
exports.addComment = async (req, res) => {
  try {
    const { doc, entry } = await findEntry(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Post not found" });

    const comment = await ForumComment.create({
      forum: doc._id,
      entry: entry._id,
      user: req.user._id,
      content: req.body.content,
      isAnonymous: req.body.isAnonymous ?? true,
    });

    entry.comments = (entry.comments || 0) + 1;
    await doc.save();

    const populated = await comment.populate("user", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete own comment (or admin) and decrement the entry count.
exports.deleteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isOwner = comment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.deleteOne();
    const { doc, entry } = await findEntry(comment.entry);
    if (entry) {
      entry.comments = Math.max(0, (entry.comments || 0) - 1);
      await doc.save();
    }
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
