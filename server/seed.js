/**
 * Boma seed script — populates the database with realistic student-first demo data:
 * campuses, users (admin/landlords/students), buildings, listings (with images &
 * room types), reviews (with recomputed building ratings), forum posts, and roommate
 * profiles (so the matching feed has data to work with).
 *
 * Run:  pnpm --dir server seed     (or  node seed.js  from the server dir)
 *
 * WARNING: this wipes the seeded collections first so it is idempotent.
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Campus = require("./Models/Campus");
const User = require("./Models/Users");
const Building = require("./Models/Building");
const Listing = require("./Models/Listing");
const Review = require("./Models/Review");
const Forum = require("./Models/ForumPost");
const ForumComment = require("./Models/ForumComment");
const RoommateProfile = require("./Models/RoommateProfile");

// ─── small helpers ───────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const jitter = (coord) => coord + (Math.random() - 0.5) * 0.02;
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const rating = () => randInt(2, 5); // 1-5, skewed positive

const IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
  "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e",
].map((u) => `${u}?w=800&q=80&auto=format&fit=crop`);

const FEATURES = [
  "Wi-Fi",
  "Water 24/7",
  "Backup generator",
  "Furnished",
  "Balcony",
  "Tiled floors",
  "Hot shower",
  "Study desk",
];
const AMENITIES = [
  "Gym",
  "Laundry",
  "Parking",
  "CCTV",
  "Study room",
  "Cafeteria",
  "Borehole water",
  "Security guard",
];
const ROOM_TYPES = [
  "bedsitter",
  "single_room",
  "shared_room",
  "studio",
  "one_bedroom",
  "two_bedroom",
];
const SLEEP = ["early_bird", "night_owl", "flexible"];
const CLEAN = ["relaxed", "tidy", "very_tidy"];
const GUESTS = ["rarely", "sometimes", "often"];
const STUDY = ["quiet", "social", "flexible"];

const ROOM_LABEL = {
  bedsitter: "Bedsitter",
  single_room: "Single Room",
  shared_room: "Shared Room",
  studio: "Studio",
  one_bedroom: "One Bedroom",
  two_bedroom: "Two Bedroom",
};

// Combinatorial description generator: ties the text to *this* listing's own
// randomly-assigned features/amenities so it reads as written-for-this-unit
// rather than one canned paragraph reused everywhere.
const LISTING_OPENERS = [
  (label, name) => `${label} in ${name}, a short walk from campus.`,
  (label, name) => `Comfortable ${label.toLowerCase()} tucked inside ${name}.`,
  (label, name) => `Bright, well-kept ${label.toLowerCase()} at ${name}.`,
  (label, name) => `Newly refreshed ${label.toLowerCase()} inside ${name}.`,
  (label, name) => `Quiet ${label.toLowerCase()} at ${name}, popular with students.`,
  (label, name) => `Spacious ${label.toLowerCase()} option in ${name}, close to the main gate.`,
  (label, name) => `Cozy ${label.toLowerCase()} in ${name} — ideal for a student budget.`,
];
const LISTING_CLOSERS = [
  "Viewing available on request.",
  "Serious inquiries only — message to schedule a visit.",
  "Available immediately for the right tenant.",
  "Ask about our current move-in offer.",
  "Ideal for students who value a quiet, secure environment.",
  "Flexible on move-in date for the right applicant.",
  "Landlord lives nearby and responds fast to maintenance requests.",
];
function buildListingDescription(roomType, buildingName, features, amenities) {
  const opener = rand(LISTING_OPENERS)(ROOM_LABEL[roomType], buildingName);
  const featureLine = features.length
    ? `Comes with ${features.slice(0, 2).join(" and ").toLowerCase()}.`
    : "";
  const amenityLine = amenities.length
    ? `Building amenities include ${amenities.slice(0, 2).join(" and ").toLowerCase()}.`
    : "";
  const closer = rand(LISTING_CLOSERS);
  return [opener, featureLine, amenityLine, closer].filter(Boolean).join(" ");
}

// Roommate bios are generated *from* the profile's own lifestyle fields so the
// prose always agrees with the structured data shown alongside it.
const SLEEP_PHRASE = {
  early_bird: "an early riser",
  night_owl: "more of a night owl",
  flexible: "flexible with sleep schedule",
};
const CLEAN_PHRASE = {
  relaxed: "fairly relaxed about tidiness",
  tidy: "keeps shared space tidy",
  very_tidy: "very particular about cleanliness",
};
const STUDY_PHRASE = {
  quiet: "needs a quiet space to study",
  social: "enjoys studying with others around",
  flexible: "adapts to whatever the room needs",
};
const GUEST_PHRASE = {
  rarely: "rarely has guests over",
  sometimes: "has guests over occasionally",
  often: "often has friends around",
};
const BIO_INTROS = [
  "Engineering student looking for a chill roommate.",
  "Final-year student, loves cooking and study groups.",
  "Business student splitting a place close to campus.",
  "Second-year, easy-going and respectful of shared space.",
  "Med student with a busy schedule but a friendly roommate.",
  "Arts student, low-key and looking for someone reliable.",
];
function buildRoommateBio(lifestyle) {
  return [
    rand(BIO_INTROS),
    `${SLEEP_PHRASE[lifestyle.sleepSchedule]}, ${CLEAN_PHRASE[lifestyle.cleanliness]}.`,
    `${STUDY_PHRASE[lifestyle.studyHabits]}; ${GUEST_PHRASE[lifestyle.guests]}.`,
  ].join(" ");
}

async function seed() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected:", process.env.MONGO_URI);

  // Wipe seeded collections (leaves anything else, e.g. a 'tests' collection, alone).
  await Promise.all([
    Campus.deleteMany({}),
    User.deleteMany({}),
    Building.deleteMany({}),
    Listing.deleteMany({}),
    Review.deleteMany({}),
    Forum.deleteMany({}),
    ForumComment.deleteMany({}),
    RoommateProfile.deleteMany({}),
  ]);
  console.log("Cleared seeded collections");

  // Drop any stale indexes left by older schema versions (e.g. a unique `username_1`
  // index that no longer exists in the model) and rebuild from the current schemas.
  for (const M of [Campus, User, Building, Listing, Review, Forum, RoommateProfile]) {
    try {
      await M.syncIndexes();
    } catch (e) {
      console.warn(`syncIndexes(${M.modelName}) warning:`, e.message);
    }
  }
  console.log("Indexes synced to current schemas");

  // ── Campuses ──
  const campuses = await Campus.create([
    { name: "University of Nairobi", shortName: "UoN", city: "Nairobi", location: { type: "Point", coordinates: [36.8172, -1.2796] } },
    { name: "Kenyatta University", shortName: "KU", city: "Nairobi", location: { type: "Point", coordinates: [36.9285, -1.1807] } },
    { name: "Jomo Kenyatta University of Agriculture and Technology", shortName: "JKUAT", city: "Juja", location: { type: "Point", coordinates: [37.0118, -1.0931] } },
    { name: "Strathmore University", shortName: "Strathmore", city: "Nairobi", location: { type: "Point", coordinates: [36.8064, -1.31] } },
    { name: "United States International University", shortName: "USIU-A", city: "Nairobi", location: { type: "Point", coordinates: [36.8826, -1.2197] } },
  ]);
  console.log(`Campuses: ${campuses.length}`);

  // ── Users ──
  const passwordHash = await bcrypt.hash("Password123", 12);

  const admin = await User.create({
    name: "Boma Admin",
    email: "admin@boma.co.ke",
    passwordHash,
    role: "admin",
    verificationStatus: "verified",
    emailVerified: true,
  });

  const landlordNames = ["Samuel Kariuki", "Teresa Muthoni", "Victor Onyango", "Wanjala Barasa"];
  const landlords = await User.create(
    landlordNames.map((name, i) => ({
      name,
      email: `landlord${i + 1}@boma.co.ke`,
      passwordHash,
      role: "landlord",
      verificationStatus: i % 2 === 0 ? "verified" : "pending",
      emailVerified: true,
      phone: `+25470000000${i + 1}`,
    })),
  );

  const studentNames = [
    "Amina Wanjiru", "Brian Otieno", "Cynthia Achieng", "David Kamau",
    "Esther Nyambura", "Felix Mwangi", "Grace Wairimu", "Hassan Ali",
    "Irene Chebet", "John Maina", "Kevin Omondi", "Lucy Njeri",
    "Mark Kiprono", "Nancy Atieno", "Oscar Mutua", "Pauline Wangui",
  ];
  const students = await User.create(
    studentNames.map((name, i) => ({
      name,
      email: `student${i + 1}@students.boma.co.ke`,
      passwordHash,
      role: "tenant",
      verificationStatus: rand(["verified", "unverified", "verified"]),
      emailVerified: true,
    })),
  );
  console.log(`Users: 1 admin, ${landlords.length} landlords, ${students.length} students`);

  // ── Buildings (anchored to campuses) ──
  const buildingSpecs = [
    ["Qwetu Hostels", 0], ["Acacia Residences", 0], ["Hillside Apartments", 0],
    ["Sunrise Hostel", 1], ["Greenview Flats", 1], ["Riverside Court", 1],
    ["Maple Heights", 2], ["Tamarind Villas", 2], ["Mwananchi Plaza", 3],
    ["Jacaranda Suites", 3], ["Comfort Homes", 4], ["Unity Towers", 4],
  ];
  const buildings = await Building.create(
    buildingSpecs.map(([name, campusIdx]) => {
      const c = campuses[campusIdx];
      return {
        name,
        address: `${name}, near ${c.shortName}, ${c.city}`,
        campus: c._id,
        location: { type: "Point", coordinates: [jitter(c.location.coordinates[0]), jitter(c.location.coordinates[1])] },
      };
    }),
  );
  console.log(`Buildings: ${buildings.length}`);

  // ── Listings ──
  const listingDocs = [];
  for (const building of buildings) {
    const count = randInt(2, 4);
    for (let i = 0; i < count; i++) {
      const roomType = rand(ROOM_TYPES);
      const creator = Math.random() < 0.85 ? rand(landlords) : rand(students); // mostly landlords, some student sublets
      const features = sample(FEATURES, randInt(2, 4));
      const amenities = sample(AMENITIES, randInt(2, 4));
      listingDocs.push({
        title: `${ROOM_LABEL[roomType]} near ${building.name.split(",")[0]}`,
        description: buildListingDescription(roomType, building.name, features, amenities),
        price: randInt(6, 35) * 1000,
        building: building._id,
        address: building.address,
        createdBy: creator._id,
        roomType,
        bedrooms: ["studio", "bedsitter", "single_room", "shared_room"].includes(roomType) ? 0 : randInt(1, 2),
        bathrooms: randInt(1, 2),
        features,
        amenities,
        images: sample(IMAGES, randInt(2, 4)),
        status: rand(["available", "available", "available", "unavailable", "pending"]),
        isVerified: Math.random() < 0.5,
        location: building.location,
      });
    }
  }
  const listings = await Listing.create(listingDocs);
  console.log(`Listings: ${listings.length}`);

  // ── Reviews (respect unique {building, reviewer}) + recompute building ratings ──
  let reviewCount = 0;
  for (const building of buildings) {
    const reviewers = sample(students, randInt(1, 4));
    for (const reviewer of reviewers) {
      await Review.create({
        title: rand([
          "Solid place to stay", "Great for students", "Decent but noisy",
          "Would recommend", "Mixed feelings", "Better than expected",
          "Good value overall", "Some issues but manageable", "Would live here again",
          "Not bad for the price", "Great location, so-so upkeep",
        ]),
        comment: rand([
          "Water is reliable and security is tight. Landlord responds quickly.",
          "Close to campus and affordable. WiFi could be better.",
          "Quiet during exams, friendly neighbours.",
          "Good value for money, but parking is limited.",
          "Caretaker is responsive, hallway lighting could be better though.",
          "Been here two semesters, no major complaints.",
          "Walking distance to lectures which is the main selling point.",
          "Backup generator actually works during outages, unlike my last place.",
          "A bit noisy on weekends but otherwise a solid stay.",
          "Landlord was flexible with rent timing when I needed it.",
          "Rooms are smaller than the photos suggest, but clean.",
          "Great community feel, most tenants are students from the same campus.",
          "Water pressure drops in the evenings, worth knowing before moving in.",
          "Security guard on site at night, felt safe walking in late.",
        ]),
        reviewer: reviewer._id,
        building: building._id,
        isAnonymous: Math.random() < 0.5,
        verified: Math.random() < 0.6,
        helpful: randInt(0, 15),
        categories: {
          cleanliness: rating(),
          maintenance: rating(),
          amenities: rating(),
          security: rating(),
          water_availability: rating(),
          landlord_reliability: rating(),
        },
      });
      reviewCount++;
    }
    await recomputeBuildingRating(building._id);
  }
  console.log(`Reviews: ${reviewCount} (building ratings recomputed)`);

  // ── Forum posts (model stores a `post` array per document) ──
  // Title/content are paired topics (not independently randomized) so a post
  // titled "Water shortage" never ends up with unrelated "lost keys" content.
  const FORUM_TOPICS = [
    { title: "Water shortage this week?", content: "Has anyone else had water issues since Monday? Caretaker not picking up." },
    { title: "Anyone subletting next semester?", content: "Moving out end of semester, room available for transfer. DM me." },
    { title: "Lost keys - found?", content: "Found a set of keys near the gate, drop by C-block if yours." },
    { title: "Noise after 10pm", content: "Can we agree on quiet hours? Exams coming up." },
    { title: "Best matatu route to campus", content: "What's the fastest route from here to the main gate during rush hour?" },
    { title: "WiFi router keeps dropping", content: "Anyone else's router restarting randomly in the evenings? Worth reporting to the caretaker?" },
    { title: "Splitting a cleaner for common areas?", content: "A few of us were thinking of pooling to hire a cleaner for the shared hallway. Interested?" },
    { title: "Power outage compensation?", content: "Third outage this month — does the landlord usually adjust rent for repeated outages?" },
    { title: "Anyone selling a mattress/desk?", content: "Moving in next week and need a desk and mattress, preferably second-hand." },
    { title: "Gate security at night", content: "Noticed the gate's been unmanned after 11pm a few times this week. Anyone else notice this?" },
  ];
  const forumDocs = [];
  for (const building of buildings) {
    const n = randInt(1, 2);
    for (let i = 0; i < n; i++) {
      const topic = rand(FORUM_TOPICS);
      forumDocs.push({
        user: rand(students)._id,
        building: building._id,
        post: [
          {
            title: topic.title,
            content: topic.content,
            isAnonymous: Math.random() < 0.5,
            resolved: Math.random() < 0.4,
            // Stats are backed by real voter/comment records below.
            voters: sample(students, randInt(0, 10)).map((s) => ({
              user: s._id,
              value: Math.random() < 0.85 ? 1 : -1,
            })),
            comments: 0,
          },
        ],
      });
    }
  }
  // Derive vote counts from the seeded voters so displayed stats are genuine.
  for (const doc of forumDocs) {
    for (const entry of doc.post) {
      entry.upvotes = entry.voters.filter((v) => v.value === 1).length;
      entry.downvotes = entry.voters.filter((v) => v.value === -1).length;
    }
  }
  const forums = await Forum.create(forumDocs);

  // Seed real comments and set each entry's comment count to match.
  const commentBodies = [
    "Same here, been a week now.",
    "Caretaker said it's fixed tomorrow.",
    "Is it still available?",
    "Thanks for the heads up.",
    "Agreed, quiet hours would help a lot.",
    "DM sent.",
    "Following this, having the same issue.",
    "Reported it too, let's see if it gets fixed faster with more of us flagging it.",
    "Happened to me last semester as well.",
    "Good idea, count me in.",
    "Appreciate the update.",
    "Still waiting to hear back myself.",
  ];
  let commentCount = 0;
  for (const doc of forums) {
    for (const entry of doc.post) {
      const commenters = sample(students, randInt(0, 6));
      for (const commenter of commenters) {
        await ForumComment.create({
          forum: doc._id,
          entry: entry._id,
          user: commenter._id,
          content: rand(commentBodies),
          isAnonymous: Math.random() < 0.5,
        });
        commentCount++;
      }
      entry.comments = commenters.length;
    }
    await doc.save();
  }
  console.log(`Forum threads: ${forums.length} (comments: ${commentCount})`);

  // ── Roommate profiles (cycle campuses so several share one → matches exist) ──
  const roommateStudents = students.slice(0, 12);
  const profileDocs = roommateStudents.map((s, i) => {
    // Wide, overlapping budget bands so seekers on a campus genuinely overlap.
    const budgetMin = randInt(4, 8) * 1000;
    const lifestyle = {
      sleepSchedule: rand(SLEEP),
      cleanliness: rand(CLEAN),
      smoking: Math.random() < 0.2,
      pets: Math.random() < 0.2,
      guests: rand(GUESTS),
      studyHabits: rand(STUDY),
    };
    return {
      user: s._id,
      // Concentrate seekers into 3 campuses so each has ~4 → denser, more useful matches.
      campus: campuses[i % 3]._id,
      budgetMin,
      budgetMax: budgetMin + randInt(6, 14) * 1000,
      moveInDate: daysFromNow(randInt(7, 90)),
      gender: rand(["male", "female"]),
      // Mostly "any" so gender preference rarely blocks a match (realistic for shared student housing).
      genderPreference: rand(["any", "any", "any", "any", "male", "female"]),
      lifestyle,
      // Generated from this profile's own lifestyle fields, so the prose always
      // agrees with the structured data shown alongside it (no mismatches like
      // a bio saying "early riser" while sleepSchedule says "night_owl").
      bio: buildRoommateBio(lifestyle),
      status: "looking",
    };
  });
  const profiles = await RoommateProfile.create(profileDocs);
  console.log(`Roommate profiles: ${profiles.length}`);

  console.log("\n✅ Seed complete.");
  console.log("Login: admin@boma.co.ke / landlord1@boma.co.ke / student1@students.boma.co.ke  (password: Password123)");

  await mongoose.disconnect();
}

// Inline copy of the building-rating recompute (mirrors reviewController.updateBuildingRating).
async function recomputeBuildingRating(buildingId) {
  const stats = await Review.aggregate([
    { $match: { building: new mongoose.Types.ObjectId(buildingId) } },
    {
      $group: {
        _id: "$building",
        totalReviews: { $sum: 1 },
        avgCleanliness: { $avg: "$categories.cleanliness" },
        avgMaintenance: { $avg: "$categories.maintenance" },
        avgAmenities: { $avg: "$categories.amenities" },
        avgSecurity: { $avg: "$categories.security" },
        avgWater: { $avg: "$categories.water_availability" },
        avgLandlord: { $avg: "$categories.landlord_reliability" },
      },
    },
  ]);

  if (!stats.length) return;
  const s = stats[0];
  const categoryRatings = {
    cleanliness: s.avgCleanliness || 0,
    maintenance: s.avgMaintenance || 0,
    amenities: s.avgAmenities || 0,
    security: s.avgSecurity || 0,
    water_availability: s.avgWater || 0,
    landlord_reliability: s.avgLandlord || 0,
  };
  const values = Object.values(categoryRatings);
  const overall = values.reduce((a, b) => a + b, 0) / values.length;

  await Building.findByIdAndUpdate(buildingId, {
    total_reviews: s.totalReviews,
    average_rating: Number(overall.toFixed(2)),
    categoryRatings,
  });
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
