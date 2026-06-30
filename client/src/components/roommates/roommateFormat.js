// Shared formatting for roommate profiles — turns the RoommateProfile schema's
// enum/number fields into the lowercase editorial copy the cards + modal display.

const SLEEP = {
  early_bird: "early riser",
  night_owl: "night owl",
  flexible: "flexible hours",
};
const CLEAN = {
  relaxed: "relaxed",
  tidy: "tidy",
  very_tidy: "very tidy",
};
const STUDY = {
  quiet: "quiet study",
  social: "social",
  flexible: "flexible study",
};
const GUESTS = {
  rarely: "rare guests",
  sometimes: "some guests",
  often: "frequent guests",
};

// Lowercase lifestyle chips, ordered by signal strength. `limit` truncates for cards.
export function lifestyleTags(profile, limit) {
  const l = profile?.lifestyle || {};
  const tags = [
    CLEAN[l.cleanliness],
    SLEEP[l.sleepSchedule],
    STUDY[l.studyHabits],
    l.smoking ? "smoker ok" : "non-smoker",
    l.pets ? "pet friendly" : null,
    GUESTS[l.guests],
  ].filter(Boolean);
  return typeof limit === "number" ? tags.slice(0, limit) : tags;
}

// "KSh 8–12k", or "under KSh 12k" when there's no floor.
export function budgetLabel(profile) {
  const min = profile?.budgetMin || 0;
  const max = profile?.budgetMax || 0;
  const k = (n) => Math.round(n / 1000);
  if (!max) return "budget flexible";
  if (!min) return `under KSh ${k(max)}k`;
  return `KSh ${k(min)}–${k(max)}k`;
}

// "AUG 2026" for the move-in chip, or "FLEXIBLE" when unset.
export function moveLabel(profile) {
  if (!profile?.moveInDate) return "FLEXIBLE";
  const d = new Date(profile.moveInDate);
  if (Number.isNaN(d.getTime())) return "FLEXIBLE";
  return d
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();
}

// Up to two initials for the avatar fallback when a user has no photo.
export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}
