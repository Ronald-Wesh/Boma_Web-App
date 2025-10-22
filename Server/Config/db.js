const mongoose=require("mongoose");

const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log(`MongoDb connected Successfully${mongoose.connection.host}`);
    }
    catch(error){
        console.error("MongoDb connection Failed",error.message);
        process.exit(1);
    }
}
module.exports=connectDb;