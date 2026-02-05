//Import Mongoose to translate with mongodb
const mongoose=require("mongoose");

//Connect to mongoDb via mongoose
const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParseer:true,
            useUnifiedToplogy:true,
        });
        console.log("MongoDb Connected Suceesfully");
    }catch(err){
        console.error("MongoDb Connection Failed",err.message);
        process.exit(1);//Exit process with failure
    }
}
module.exports=connectDb;