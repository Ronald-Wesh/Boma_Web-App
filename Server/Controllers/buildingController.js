const Building=require('../Models/Building');

//Create a new building
exports.createBuilding=async(req,res)=>{
    try{
        const {name,location,address}=req.body;
        const building=await Building.create({
            name,
            location,
            address
        });
        const savedBuilding=await building.save();
        res.status(201).json(savedBuilding);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Get all buildings
exports.getAllBuildings=async(req,res)=>{
    try{
        const buildings=await Building.find();
        res.status(200).json(buildings)
    }catch(err){
    res.status(400).json({message:err.message});
}
};

//Get a specific building by ID
exports.getBuildingByID=async(req,res)=>{
    try{
        const building=await Building.findById(req.params.buildingId);
        if(!building) return res.status(404).json({message:"Building Not Found"});
        res.json(building);
    }catch(err){
        res.status(400).json({message:err.message});
    }
};

//Update a building by ID
exports.updateBuilding=async(req,res)=>{
    try{
        const building=await Building.findByIdAndUpdate(
            req.params.buildingId,
            req.body,
            {new:true});
        if(!building) return res.status(404).json({message:"Building Not Found"});
        res.json(building);
    }catch(err){
        res.status(400).json({message:err.message});
    }
}

//Delete a building by ID
exports.deleteBuilding=async(req,res)=>{
    try{
        const building=await Building.findByIdAndDelete(req.params.buildingId);
        if(!building) return res.status(404).json({message:"Building Not Found"});
        res.json({message:"Building deleted successfully"});
    }catch(err){
        res.status(400).json({message:err.message});
    }
}