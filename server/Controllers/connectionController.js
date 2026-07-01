const ConnectionRequest = require("../Models/ConnectionRequest");
const RoommateProfile = require("../Models/RoommateProfile");

// Send a connect request to another user. One request per pair, ever — no
// re-request after a decline (rejects if a request already exists between
// the two users in either direction).
exports.createConnection = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId is required" });
    }
    if (String(recipientId) === String(requesterId)) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }

    const recipientProfile = await RoommateProfile.findOne({
      user: recipientId,
      status: "looking",
    });
    if (!recipientProfile) {
      return res.status(400).json({
        message: "This user isn't currently looking for a roommate",
      });
    }

    const existing = await ConnectionRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });
    if (existing) {
      return res.status(409).json({
        message: "A connect request already exists between you and this user",
      });
    }

    const connection = await ConnectionRequest.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Pending requests where the current user is the recipient.
exports.getIncomingConnections = async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      recipient: req.user._id,
      status: "pending",
    })
      .populate("requester", "name avatar verificationStatus")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Recipient accepts or declines a pending request.
exports.respondToConnection = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'decline'" });
    }

    const connection = await ConnectionRequest.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: "Connect request not found" });
    }
    if (String(connection.recipient) !== String(req.user._id)) {
      return res.status(403).json({
        message: "Only the recipient can respond to this request",
      });
    }
    if (connection.status !== "pending") {
      return res.status(400).json({ message: "This request has already been answered" });
    }

    connection.status = action === "accept" ? "accepted" : "declined";
    await connection.save();

    res.status(200).json(connection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
