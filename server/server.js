require("dotenv").config();

const cors = require("cors");
const morgan = require("morgan");
const connectDb = require("./Config/db");
const express = require("express");
const helmet=require("helmet");

connectDb();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL=process.env.CLIENT_URL ||"http://localhost:5173";

//Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Import Routes
const authRoutes = require("./Routes/authRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const listingRoutes = require("./Routes/listingRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const forumRoutes = require("./Routes/forumRoutes");

//Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api", reviewRoutes);
app.use("/api", forumRoutes);
app.use("/api/admin", adminRoutes);

//health Route=sHOW SERVER IS RUNNING
app.get("/",(req,res)=>{
  res.json({message:"Boma Web App Server is Running"})
});
//404 handler=if a route is not found
app.use((req,res)=>{
  res.status(404).json({message:`${req.method} ${req.url} Route Not Found `});//req.method is the HTTP method used to access the route,req.url is the URL accessed
});
//central error handler=if an error occurs
app.use((err,req,res,next)=>{
  console.error("Server Error:",err.stack);
  res.status(err.statusCode||500).json({
    message:err.message||"Internal server Error",
    stack:process.env.NODE_ENV==="development"?err.stack:null
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
