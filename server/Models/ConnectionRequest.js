const mongoose = require("mongoose");

// A roommate-connect request between two users. One per pair, ever — see
// connectionController.js for the both-directions duplicate check (no
// DB-level compound unique index needed since all writes go through one
// controller function).
const ConnectionRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true },
);

ConnectionRequestSchema.index({ requester: 1, recipient: 1 });
ConnectionRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("ConnectionRequest", ConnectionRequestSchema);
