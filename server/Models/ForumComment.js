const mongoose = require("mongoose");

// A comment on a single forum thread entry (post[] subdocument).
const ForumCommentSchema = new mongoose.Schema(
  {
    forum: { type: mongoose.Schema.Types.ObjectId, ref: "Forum", required: true },
    entry: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isAnonymous: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ForumCommentSchema.index({ entry: 1, createdAt: 1 });

module.exports = mongoose.model("ForumComment", ForumCommentSchema);
