const mongoose=require("mongoose")
const BuildingSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    address:{
        type:String,
        required:[true,"Building address is required"]
    },
    location:{
        type:{
            type:String,
            enum:["Point"],
            default:"Point",
            required:true
        },
        coordinates:{
            type:[Number],
            required:true
        }

    },
    average_rating:{
        type:Number,
        default:0
    },
    total_reviews:{
        type:Number,
        default:0
    }

},{timestamps:true});

BuildingSchema.index({location:"2dsphere"})
module.exports=mongoose.model("Building",BuildingSchema)