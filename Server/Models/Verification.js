const mongoose=require("mongoose");

const VerificationSchema=new mongoose.Schema({
    User:{type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    //Document,
    verifiedBy:{

    },
    status:{
        type:String,
        enum:["verified","pending","rejected"],
        default:"pending"
    },
    remarks:{
        type:String,
    }
},{timestamps:true});

module.exports=mongoose.model("Verification",VerificationSchema)