const User=require("../Models/Users");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

//Helper to sanitize user object b4 sending t ofrontend
const sanitizeUser=(user)=>({
    id:user._id,
    name:user.name,
    email:user.email,
    role:user.role,
    phone:user.phone,
    verication_Status:user.verication_Status
})
    

exports.register=async(req,res)=>{
    try{
        //Validate fields=None are empty
        const {name,email,password,role,phone}=req.body;
        if(!name||!email||!password||!role){
            return res.status(400).json({message:'All fields are required'})
        }
        //Validate email
        if(!email.match(/^\S+@\S+\.\S+$/)){
            return res.status(400).json({message:"Invalid Email Format"})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 Characters"})
        }//Check for duplicate email
        const existingUser=await User.findOne({email:email.toLowerCase().trim()})
        if (existingUser){
            return res.status(400).json({message:"Email already in use"})
        }//Check for dupliacte username
        const existingUsername=await User.findOne({name:name.toLowerCase().trim()})
        if(existingUsername){
            return res.status(400).json({message:"Username already in use"})
        }
        //Check for phone Number
        const existingNumber=await User.findOne({phone:phone.toLowerCase().trim()})
        if(existingNumber){
            return res.status(400).json({message:"Phone-Number already in Use"})
        };
        //hash password
        const salt=await bcrypt.genSalt(10);
        const passwordHash=await bcrypt.hash(password,salt);

        //Creating a new user baseed on the inputs=Login data
        const user=new User({name,
            email:email.toLowerCase().trim(),
            passwordHash,
            role,
            phone:phone || ""})

        // await user.save();//Runs the Pre.save middleware to hash the password

        //Craeting a JWT token=Allowing login session
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"})
        //Return user+token =let frontend Store login
        res.status(201).json({//send token and data to frontend
            token,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
            phone:user.phone,
            verication_Status:user.verication_Status
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
        const user=await User.findOne({email:email.toLowerCase().trim()}).select('+passwordHash')
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"})
        }

        //Chekc password using th eUSer models comparePassword Method
        const isMatch=await bcrypt.compare(password,user.passwordHash);
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
                name:user.name,
                email:user.email,
                role:user.role,
                phone:user.phone,
                verification_Status:user.verification_Status
            }
        })
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
};
exports.getUserProfile=async(req,res)=>{
    try{
        //req.user is set in authMiddleware after token verification
        const user=await User.findById(req.user.id).select('-password');//Exclude password
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        //else send user data-exclude password
        res.json({user})
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
}
exports.getMe=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).select('-password');
        res.json({user});
    }catch(err){
        res.status(500).json({message:err.message});
    }
}