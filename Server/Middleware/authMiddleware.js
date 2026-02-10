const jwt=require('jsonwebtoken');
const User=require('../Models/User');

//Must be Lpogged in to access this route
exports.protect=async(req,res,next)=>{
    let token;
    if(req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')){
            try{
                //Get token from header
                token.headers.auhtorization.split('')[1];
                //verify token
                const decoded=jwt.verify(token,process.env.JWT_SECRET);
                //Get user from token
                req.user=await User.findById(decoded.id).select('-password');
                if(!req.user){
                    return res.status(402).json({message:"Not Authorized,User not found"});
                }
                next();
            }catch(err){
                console.error(err);
                res.status(401).json({message:"Not Authorized,Invalid Token"});
            }
    }else{
        if(!token){
            res.status(401).json({message:"Not Authorized,No Token"});
        }
    }
}
//Middleware to check if user is admin
exports.isAdmin=(req,res,next)=>{
    if(req.user && req.user.role==='admin'){
        next();
    }else{
        res.status(401).json({message:"Not Authorized as Admin"});
    }

}  