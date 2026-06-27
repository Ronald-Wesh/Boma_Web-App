const RoommateProfile = require("../Models/RoommateProfile");

// ─── Compatibility scoring ───────────────────────────────────────────────
// Given two roommate profiles, return a 0-100 compatibility score. Higher = better fit.
// Budget overlap and lifestyle alignment drive the score; this is what makes the
// "matches" feed feel smart rather than a raw list.
const rangesOverlap = (aMin, aMax, bMin, bMax) => aMin <= bMax && bMin <= aMax;

const compatibilityScore = (me, other) => {
  let score = 0;

  // Budget overlap (up to 40 pts) — proportion of the union that overlaps.
  const overlapLow = Math.max(me.budgetMin, other.budgetMin);
  const overlapHigh = Math.min(me.budgetMax, other.budgetMax);
  if (overlapHigh >= overlapLow) {
    const overlap = overlapHigh - overlapLow;
    const union =
      Math.max(me.budgetMax, other.budgetMax) -
      Math.min(me.budgetMin, other.budgetMin);
    score += union > 0 ? (overlap / union) * 40 : 40;
  }

  // Lifestyle alignment (up to 50 pts, 10 dimensions-ish weighted).
  const ml = me.lifestyle || {};
  const ol = other.lifestyle || {};
  if (ml.sleepSchedule === ol.sleepSchedule) score += 12;
  if (ml.cleanliness === ol.cleanliness) score += 12;
  if (ml.studyHabits === ol.studyHabits) score += 10;
  if (ml.guests === ol.guests) score += 6;
  if (ml.smoking === ol.smoking) score += 6;
  if (ml.pets === ol.pets) score += 4;

  // Move-in timing (up to 10 pts) — closer dates score higher.
  if (me.moveInDate && other.moveInDate) {
    const daysApart =
      Math.abs(new Date(me.moveInDate) - new Date(other.moveInDate)) /
      (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysApart / 6); // within ~60 days still scores
  }

  return Math.round(Math.min(100, score));
};

// Mutual gender-preference check: each side must accept the other's gender.
const genderCompatible = (me, other) => {
  const meAcceptsOther =
    me.genderPreference === "any" || me.genderPreference === other.gender;
  const otherAcceptsMe =
    other.genderPreference === "any" || other.genderPreference === me.gender;
  return meAcceptsOther && otherAcceptsMe;
};

// ─── Handlers ────────────────────────────────────────────────────────────

// Create or update the current user's roommate profile (upsert).
exports.upsertMyProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const {
      campus,
      budgetMin,
      budgetMax,
      moveInDate,
      gender,
      genderPreference,
      lifestyle,
      bio,
      status,
    } = req.body;

    const update = {
      user: req.user._id,
      campus,
      budgetMin,
      budgetMax,
      moveInDate,
      gender,
      genderPreference,
      lifestyle,
      bio,
      status,
    };

    const profile = await RoommateProfile.findOneAndUpdate(
      { user: req.user._id },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate("campus", "name shortName");

    res.status(200).json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get the current user's roommate profile.
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const profile = await RoommateProfile.findOne({
      user: req.user._id,
    }).populate("campus", "name shortName");
    if (!profile)
      return res.status(404).json({ message: "No roommate profile yet" });
    res.status(200).json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete the current user's roommate profile.
exports.deleteMyProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await RoommateProfile.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ message: "Roommate profile removed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Browse roommate profiles (public), optional ?campus= filter.
exports.browseProfiles = async (req, res) => {
  try {
    const { campus, status = "looking" } = req.query;
    const filter = { status };
    if (campus) filter.campus = campus;

    const profiles = await RoommateProfile.find(filter)
      .populate("user", "name avatar verificationStatus")
      .populate("campus", "name shortName")
      .sort({ updatedAt: -1 });

    res.status(200).json(profiles);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Ranked matches for the current user (protected). The core "smart" feature:
// same campus, mutual gender preference, budget overlap, sorted by compatibility.
exports.getMatches = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const me = await RoommateProfile.findOne({ user: req.user._id });
    if (!me)
      return res.status(400).json({
        message: "Create your roommate profile first to see matches",
      });

    const candidates = await RoommateProfile.find({
      _id: { $ne: me._id },
      campus: me.campus,
      status: "looking",
    })
      .populate("user", "name avatar verificationStatus")
      .populate("campus", "name shortName");

    const matches = candidates
      .filter(
        (c) =>
          genderCompatible(me, c) &&
          rangesOverlap(me.budgetMin, me.budgetMax, c.budgetMin, c.budgetMax),
      )
      .map((c) => ({
        profile: c,
        compatibility: compatibilityScore(me, c),
      }))
      .sort((a, b) => b.compatibility - a.compatibility);

    res.status(200).json({ total: matches.length, matches });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
