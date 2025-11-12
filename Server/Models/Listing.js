const mongoose=require("mongoose")
const building=require("./Building")

const ListingSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    price:{
        type:Number,
        required:[true,"Priec is required"],
        min:[0,"Price must be a positive Number"]
    },
    description:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    building:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Building",
        required:true,
    },
    features:{
        type:String,
        required:true
    },
    amenities:{type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

module.exports=mongoose.model("Listing",ListingSchema)