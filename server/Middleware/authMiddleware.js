const jwt = require("jsonwebtoken");
const User = require("../Models/Users");

//Must be Logged in to access this route
exports.protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found for this token",
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access is required",
    });
  }

  return next();
};



// const jwt = require("jsonwebtoken");
// const User = require("../Models/Users");

// //Must be Logged in to access this route
// exports.protect=async(req,res,next)=>{
//     let token;
//     if(req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')){
//             try{
//                 //Get token from header
//                 token=req.headers.authorization.split(' ')[1];
//                 //verify token
//                 const decoded=jwt.verify(token,process.env.JWT_SECRET);
//                 //Get user from token
//                 req.user=await User.findById(decoded.id).select('-password');
//                 if(!req.user){
//                     return res.status(401).json({message:"Not Authorized,User not found"});
//                 }
//                 next();
//             }catch(err){
//                 console.error(err);
//                 res.status(401).json({message:"Not Authorized,Invalid Token"});
//             }
//     }else{
//         if(!token){
//             res.status(401).json({message:"Not Authorized,No Token"});
//         }
//     }
// }
// //Middleware to check if user is admin
// exports.isAdmin=(req,res,next)=>{
//     if(req.user && req.user.role==='admin'){
//         next();
//     }else{
//         res.status(401).json({message:"Not Authorized as Admin"});
//     }

// };
