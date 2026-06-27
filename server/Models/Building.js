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
    campus:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Campus"
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
            default:[0,0],
            required:true
        }

    },
    average_rating:{
        type:Number,
        default:0
    },
    categoryRatings:{
        cleanliness:{type:Number,default:0},
        maintenance:{type:Number,default:0},
        amenities:{type:Number,default:0},
        security:{type:Number,default:0},
        water_availability:{type:Number,default:0},
        landlord_reliability:{type:Number,default:0}
    },
    total_reviews:{
        type:Number,
        default:0
    }

},{timestamps:true});

BuildingSchema.index({location:"2dsphere"})
module.exports=mongoose.model("Building",BuildingSchema)