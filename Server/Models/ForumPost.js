  const mongoose=require("mongoose");

const ForumPostSchema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
  post:[{
    title:{
      type:String,
      required:true
    },
    content:{
      type:String,
      required:true
    },
    isAnonymous:{
      type:Boolean,
      default:true
    },
    resolved:{
      type:Boolean,
      default:false
    },
    upvotes:{
      type:Number,
      default:0
    },
    downvotes:{
      type:Number,
      default:0
    },
    comments:{
      type:Number,
      default:0
    }
  }],
  building:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Building",
    required:true
  },

},{timestamps:true});

ForumPostSchema.index({building:1,createdAt:-1});
ForumPostSchema.index({user:1});
ForumPostSchema.index({resolved:1});

module.exports=mongoose.model("Forum",ForumPostSchema)