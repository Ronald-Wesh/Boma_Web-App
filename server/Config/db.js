//Import Mongoose to translate with mongodb
const mongoose=require("mongoose");

//Connect to mongoDb via mongoose
const connectDb=async()=>{
    try{
        //Fail fast if URI missing=check if URI exists
        if(!process.env.MONGO_URI){
            throw new Error("MONGO_URI missing in .env file")
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDb Connected Suceesfully");
        //connection lifecycle listeners
        mongoose.connection.on("connected",()=>{
            console.log("Mongoose connected to Db");
        });
        mongoose.connection.on("error",(err)=>{
            console.error("Mongoose connection error:",err);
        });
        mongoose.connection.on("disconnected",()=>{
            console.log("Mongoose disconnected");
        });
    }catch(err){
        console.error("MongoDb Connection Failed",err.message);
        //process.exit(1);//Exit process with failure
        throw err;
    }
}
module.exports=connectDb;