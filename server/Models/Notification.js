const mongoose=require("mongoose")

const NotificationSchema=new mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    title:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    isRead:{
        type:Boolean,
        default:false
    },


},{timestamps:true});

module.exports=mongoose.model("Notification",NotificationSchema)