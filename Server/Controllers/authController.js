const User=require("../Models/Users")

const jwt=require("jsonwebtoken")

exports.register=async(req,res)=>{
    try{
        //Vlaidate fields=None are empty
        const {username,email,password,role}=req.body;
        if(!username||!email||!password||!role){
            return res.status(400).json({message:'All fields are required'})
        }
        //Validate email
        if(!email.match(/^\S+@\S+\.\S+$/)){
            return res.status(400).json({message:"Invalid Email Format"})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 Characters"})
        }//Check for duplicate email
        const existingUser=await User.findOne({email})
        if (existingUser){
            return res.status(400).json({message:"Email already in use"})
        }//Check for dupliacte username
        const existingUsername=await User.findOne({username})
        if(existingUsername){
            return res.status(400).json({message:"Username already in use"})
        }

        //Creating a new user baseed on the inputs=Login data
        const user=new User({username,email,password,role})

        await user.save();//Runs the Pre.save middleware to hash the password

        //Craeting a JWT token=Allowing login session
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"})
        //Return user+token =let frontend Store login
        res.status(201).json({//send token and data to frontend
            token,
        user:{id:user._id,
            username:user.username,
            email:user.email,
            role:user.role,
        }})
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

//LOGIN USer
exports.login=async(req,res)=>{
    try{
        //Read or Obtain data from the frontend
        const{email,password}=req.body;
        //Validate input
        //if no email
        if(!email||!password){
            return res.status(400).json({message:"Email and password required"})
        }
        //Check if the User exists in database via email and password
        const user=await User.findOne({email}).select('+password')
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        //Chekc passwor using th eUSer models comparePassword Method
        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message:"Ivalid Credentials"})
        }
        //Creating JWT token if user signs in successfully
        const token=await jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});
        //Send back to frontend
        res.json({
            token,
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                role:user.role,
            }
        })
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
};
