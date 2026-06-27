const mongoose = require("mongoose");

// A university / college campus. Buildings (and therefore listings) are anchored
// to a nearby campus — this is what makes Boma student-first: "housing near X University".
const CampusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
        required: true,
      },
    },
  },
  { timestamps: true },
);

CampusSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Campus", CampusSchema);
