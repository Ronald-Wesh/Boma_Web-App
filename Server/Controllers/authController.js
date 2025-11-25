const User=require("../Models/Users")

const jwt=require("jsonwebtoken")

exports.register=async(req,res)=>{
    try{
        const {username,email,password,role}=req.body;
        if(!username||!email||!password||!role){
            return res.status(400).json({message:'All fields are required'})
        }
        if(!email.match(/^\S+@\S+\.\S+$/)){
            return res.status(400).json({message:"Invalid Email Format"})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 Characters"})
        }
        const existingUser=await User.findOne({email})
        if (existingUser){
            return res.status(400).json({message:"Email already in use"})
        }
        const existingUsername=await User.findOne({username})
        if(existingUsername){
            return res.status(400).json({message:"Username already in use"})
        }

        //Creating a new user baseed on the inputs=Login data
        const user=new User({username,email,password,role})

        await user.save();//Runs the Pre.save middleware to hash the password

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
    }
}