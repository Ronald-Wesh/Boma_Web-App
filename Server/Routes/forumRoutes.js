const express=require('express');
const Router=express.Router();
const {protect}=require("../Middleware/authMiddleware");
const {createPost,getAllForums,getSpecificBuildingForums,deletePost}=require("../Controllers/forumController");

//Create a new Forum Post
Router.post("/buildings/:buildingId/forum",protect,createPost);

//Get all Forums
Router.get("/forums",getAllForums);

//Get Specific Building Forums
Router.get("/buildings/:buildingId/forums",getSpecificBuildingForums);

//Delete a Post
Router.delete("/forums/:postId",protect,deletePost);

module.exports=Router;