const mongoose=require("mongoose")

const ReviewSchema=new mongoose.Schema({
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
    ratings:{
        security:{type:[Number,"Rate From scale of 1 to 5 "],min:1,max:5},
        water_availabilty:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5},
        landlord_reliabilty:{type:[Number,"Rate from scale of 1 to 5"],min:1,max:5}
    },
    isAnonymous:{tpe:Boolean,
        default:true
    },
    comment:{type:String}
},{timestamps:true});

module.exports=mongoose.model("Review",ReviewSchema)