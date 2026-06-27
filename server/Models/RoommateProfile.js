const mongoose = require("mongoose");

// A student's roommate-seeking profile. One per user. Powers Boma's roommate matching:
// match seekers on the same campus by budget overlap, move-in timing, gender preference,
// and lifestyle compatibility.
const RoommateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one roommate profile per user
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    budgetMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    budgetMax: {
      type: Number,
      min: 0,
      required: true,
    },
    moveInDate: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    genderPreference: {
      type: String,
      enum: ["any", "male", "female"],
      default: "any",
    },
    lifestyle: {
      sleepSchedule: {
        type: String,
        enum: ["early_bird", "night_owl", "flexible"],
        default: "flexible",
      },
      cleanliness: {
        type: String,
        enum: ["relaxed", "tidy", "very_tidy"],
        default: "tidy",
      },
      smoking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      guests: {
        type: String,
        enum: ["rarely", "sometimes", "often"],
        default: "sometimes",
      },
      studyHabits: {
        type: String,
        enum: ["quiet", "social", "flexible"],
        default: "flexible",
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [600, "Bio cannot exceed 600 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["looking", "matched", "paused"],
      default: "looking",
    },
  },
  { timestamps: true },
);

RoommateProfileSchema.index({ campus: 1, status: 1 });

module.exports = mongoose.model("RoommateProfile", RoommateProfileSchema);
