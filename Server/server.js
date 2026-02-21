const cors=require("cors");
const morgan=require("morgan")
const connectDb=require("./Config/db")
const express=require("express")
require("dotenv").config();

connectDb();

const app=express();
const PORT=process.env.PORT||5000;

//Middleware
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));

app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({extended:true}));

//Import Routes
const authRoutes=require("./Routes/authRoutes");
//const adminRoutes=require("./Routes/adminRoutes");
const listingRoutes=require("./Routes/listingRoutes");
const reviewRoutes=require("./Routes/reviewRoutes");

//Use Routes
app.use("/api/auth",authRoutes);
app.use("/api/listings",listingRoutes)
app.use("/api",reviewRoutes);
//app.use("/api/admin",adminRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on PORT ${PORT}`)
})