const mongoose=require("mongoose")

const ReviewSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    comment:{
        type:String,
        trim:true
    },
    reviewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    building:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Building",
        required:true
    },
    categories:{
        cleanliness:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5},
        maintenance:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5},
        amenities:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5},
        security:{type:[Number,"Rate From scale of 1 to 5 "],min:1,max:5},
        water_availabilty:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5},
        landlord_reliabilty:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5}
    },
    isAnonymous:{type:Boolean,
        default:true
    },// Verification status
    verified: {
        type: Boolean,
        default: false // true if user actually lived/lives there
    }
},{timestamps:true});

//Index for effiecient querying
ReviewSchema.index({building:1,reviewer:1},{unique:true}) //One review per user per building
ReviewSchema.index({building:1}) //For fetching reviews of a building
ReviewSchema.index({reviewer:1}) //For fetching reviews by a user
ReviewSchema.index({categories:1}) //For fetching reviews based on ratings
ReviewSchema.index({ building: 1, createdAt: -1 }) // For fetching recent reviews of a building


module.exports=mongoose.model("Review",ReviewSchema)