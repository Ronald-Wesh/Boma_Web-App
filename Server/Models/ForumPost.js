  const mongoose=require("mongoose");

const ForumPostSchema=new mongoose.Schema({
  post:[{
    User:{type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
    isAnonymous:{
      type:Boolean,
      default:true
    },
    content:{
      type:String,
    },
    resolved:{
      type:Boolean,
      default:false
    }
  }],
  Building:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Building",
    required:true
  },

},{timestamps:true});

module.exports=mongoose.model("Forum",ForumPostSchema)