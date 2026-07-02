const Enquiry = require("../Models/Enquiry");
const Listing = require("../Models/Listing");

// Public (optionally authenticated): a tenant enquires about a listing.
exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Please enter your name" });
    }
    if (!phone || phone.trim().length < 7) {
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });
    }
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ message: "Please enter a message" });
    }

    const listing = await Listing.findById(req.params.listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const enquiry = await Enquiry.create({
      listing: listing._id,
      landlord: listing.createdBy,
      tenant: req.user?._id || null,
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });

    res.status(201).json(enquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Enquiries for the logged-in landlord's own listings, newest first.
exports.getMyEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ landlord: req.user._id })
      .populate("listing", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(enquiries);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Landlord toggles an enquiry between "new" and "contacted".
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["new", "contacted"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'new' or 'contacted'" });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    if (enquiry.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: you can only update enquiries on your own listings",
      });
    }

    enquiry.status = status;
    await enquiry.save();

    res.status(200).json(enquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
