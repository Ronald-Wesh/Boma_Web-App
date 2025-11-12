const forumPostSchema = new mongoose.Schema({
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  });
  