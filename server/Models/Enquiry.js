const mongoose = require("mongoose");

// A tenant's one-way enquiry about a listing. No in-app reply thread — the
// landlord sees the message + contact info and follows up by phone/email.
const EnquirySchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted"],
      default: "new",
    },
  },
  { timestamps: true },
);

EnquirySchema.index({ landlord: 1, status: 1 });

module.exports = mongoose.model("Enquiry", EnquirySchema);
