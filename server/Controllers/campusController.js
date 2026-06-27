const Campus = require("../Models/Campus");
const Building = require("../Models/Building");

// List all campuses (public) — powers campus pickers and filters.
exports.getAllCampuses = async (req, res) => {
  try {
    const campuses = await Campus.find().sort({ name: 1 });
    res.status(200).json(campuses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Single campus by id (public).
exports.getCampusById = async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.campusId);
    if (!campus) return res.status(404).json({ message: "Campus Not Found" });
    res.status(200).json(campus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Buildings anchored to a campus (public).
exports.getCampusBuildings = async (req, res) => {
  try {
    const campus = await Campus.findById(req.params.campusId);
    if (!campus) return res.status(404).json({ message: "Campus Not Found" });

    const buildings = await Building.find({ campus: req.params.campusId }).sort({
      average_rating: -1,
    });
    res.status(200).json({
      campus: { _id: campus._id, name: campus.name, shortName: campus.shortName },
      totalBuildings: buildings.length,
      buildings,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
