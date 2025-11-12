// Create a new listing
router.post("/", async (req, res) => {
    try {
      const { title, price, buildingId, longitude, latitude } = req.body;
      const listing = await Listing.create({
        title,
        price,
        building: buildingId,
        location: {
          type: "Point",
          coordinates: [longitude, latitude]
        }
      });
      res.status(201).json(listing);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  // Get all listings
  router.get("/", async (req, res) => {
    const listings = await Listing.find().populate("building");
    res.json(listings);
  });
  