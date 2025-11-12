const cors=require("cors")
const morgan=require("morgan")
const connectDb=require("./Config/db")
const express=require("express")
require("dotenv").config();

//dotenv.config();
connectDb();


const app=express();
const PORT=process.env.PORT ||5000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});

