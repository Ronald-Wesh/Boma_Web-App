const Verification = require('../models/Verification');
const User = require('../models/User');

// LANDLORD: Submits verification request
exports.createVerificationRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'landlord') {
      return res.status(403).json({ message: 'Only landlords can request verification' });
    }

    const existing = await Verification.findOne({ Landlord: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Verification already submitted' });
    }

    const verification = new Verification({
      Landlord: req.user._id,
      // Verifier: req.body.verifierId, // Or default to null/admin for now
      reason: req.body.reason,
    });

    await verification.save();
    res.status(201).json({ message: 'Verification request submitted', verification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ADMIN: Approves verification
exports.submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'landlord') {
      return res.status(404).json({ message: "Landlord not found" });
    }

    const request = await Verification.findOne({ landlord: user._id });
    if (!request) return res.status(404).json({ message: "Verification request not found" });

    user.isVerified = true;
    user.verification_status = "verified";
    user.verified_by = req.user._id;
    await user.save();

    request.status = "verified";
    request.Verifier = req.user._id;
    await request.save();

    res.json({ message: "User verified", user, verification: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};