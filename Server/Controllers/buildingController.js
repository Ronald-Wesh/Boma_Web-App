const Building =require('../models/Building');

// Create a new building
exports.createBuilding = async (req, res) => {
  try {
    const { name, location, address } = req.body;
    const building = new Building({
      name,
      location,
      address,
    });
    const savedBuilding = await building.save();
    res.status(201).json(savedBuilding);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get a single building by ID
exports.getBuildingById = async (req, res) => {
  try {
    const building = await Building.findById(req.params.buildingId);
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json(building);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all buildings (for listing purposes)
exports.getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a building
exports.updateBuilding = async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.buildingId,
      req.body,
      { new: true }
    );
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json(building);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a building
exports.deleteBuilding = async (req, res) => {
  try {
    const building = await Building.findByIdAndDelete(req.params.buildingId);
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json({ message: 'Building deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};