const mongoose=require("mongoose")


const ListingSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:[true,"Price is required"],
        min:[0,"Price must be a positive Number"]
    },
    description:{
        type:String,
        required:true,
    },
    //type
    address:{
        type:String,
        required:true,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
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
    // isVerified:{
    //     type:Boolean,
    //     default:false
    // },
    owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
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
    }
},{timestamps:true});

ListingSchema.index({location:"2dsphere"})
module.exports=mongoose.model("Listing",ListingSchema)