const mongoose=require("mongoose");

const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        console.log(`MongoDb Connection Succesful ${mongoose.connection.host}`)
    }
    catch(error){
        console.error("MongoDb Connection Failed",error.message);
        process.exit(1);
    }
};
module.exports=connectDb;
