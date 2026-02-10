
//Verify User
const User=require('../Models/User');

// exports.verifyUser=async(req,res)=>{
//     try{
//         const user=await User.findById(req.params.userId);
//         if(!user){
//             return res.status(404).json({message:"User not found"});
//         }
//         user.isVerified=true;
//         await user.save();
//         res.status(200).json({message:"User verified successfully",user});
//     }catch(err){
//         res.status(500).json({message:err.message});
//     }
// }


//Finds a user by ID → sets isVerified to true → returns the updated user.
exports.verifyUser=async(req,res)=>{
    try{
        const user=await User.findByIdAndUpdate(req.params.userId,
            {isVerified:true},
            {new:true});

            if(!user) return res.status(404).json({message:"User not found"});
            res.status(200).json({message:"User verified successfully",user});
    }catch(err){
        res.status(500).json({message:err.message});
    }
};
 