const mongoose=require("mongoose")
const ListingSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    building:{},
    features:{},
    amenities:{},
})