const mongoose = require("mongoose");

const isValidImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [160, "Title cannot exceed 160 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    bedrooms: {
      type: Number,
      required: [true, "Bedrooms is required"],
      min: [0, "Bedrooms cannot be negative"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Bathrooms is required"],
      min: [0, "Bathrooms cannot be negative"],
    },
    amenities: {
      type: [String],
      default: [],
      set: (values = []) =>
        (Array.isArray(values) ? values : [])
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean),
    },
    features: {
      type: [String],
      default: [],
      set: (values = []) =>
        (Array.isArray(values) ? values : [])
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean),
    },
    status: {
      type: String,
      enum: ["available", "unavailable", "pending"],
      default: "available",
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Landlord is required"],
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: [true, "Building is required"],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (values = []) =>
          (Array.isArray(values) ? values : []).every((value) =>
            isValidImageUrl(value),
          ),
        message: "Images must contain only valid http/https URLs",
      },
      set: (values = []) =>
        (Array.isArray(values) ? values : [])
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      // GeoJSON order is always [lng, lat].
      coordinates: {
        type: [Number],
        required: [true, "Location coordinates are required"],
        validate: {
          validator: (coordinates = []) => {
            if (!Array.isArray(coordinates) || coordinates.length !== 2) {
              return false;
            }

            const [lng, lat] = coordinates;
            return (
              Number.isFinite(lng) &&
              Number.isFinite(lat) &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            );
          },
          message:
            "Location coordinates must be [lng, lat] with valid longitude and latitude ranges",
        },
      },
    },
  },
  { timestamps: true },
);

ListingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Listing", ListingSchema);
