const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../Models/Users");

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;
const PUBLIC_REGISTRATION_ROLES = new Set(["tenant", "landlord"]);

let googleClient;

const getGoogleClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("GOOGLE_CLIENT_ID is not configured");
    error.statusCode = 500;
    throw error;
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  return googleClient;
};

const verifyGoogleIdToken = async (credential) => {
  if (typeof credential !== "string" || !credential.trim()) {
    const error = new Error("Google credential is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || !payload.email_verified) {
      const error = new Error("Google account email could not be verified");
      error.statusCode = 401;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const authError = new Error("Invalid Google credential");
    authError.statusCode = 401;
    throw authError;
  }
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  authProvider: user.authProvider || "password",
  emailVerified: Boolean(user.emailVerified),
  verificationStatus:
    user.verificationStatus || user.verication_Status || "unverified",
  avatar: user.avatar,
  phone: user.phone,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role: requestedRole,
      type,
      phone = "",
      avatar = "",
    } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedRole = (requestedRole || type || "tenant").toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (normalizedRole === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created through public registration",
      });
    }

    if (!PUBLIC_REGISTRATION_ROLES.has(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either tenant or landlord",
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationStatus =
      normalizedRole === "landlord" ? "pending" : "unverified";

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      authProvider: "password",
      emailVerified: false,
      role: normalizedRole,
      verificationStatus,
      avatar: typeof avatar === "string" ? avatar.trim() : "",
      phone: typeof phone === "string" ? phone.trim() : "",
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message:
          "This account does not have a password yet. Continue with Google sign-in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const payload = await verifyGoogleIdToken(credential);
    const email = payload.email.toLowerCase();
    const googleSub = payload.sub;

    let user = await User.findOne({
      $or: [{ googleSub }, { email }],
    }).select("+passwordHash");

    if (!user) {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleSub,
        authProvider: "google",
        emailVerified: true,
        avatar: payload.picture || "",
        role: "tenant",
        verificationStatus: "unverified",
      });
    } else {
      if (user.googleSub && user.googleSub !== googleSub) {
        return res.status(409).json({
          success: false,
          message:
            "A different Google account is already linked to this email address.",
        });
      }

      if (!user.googleSub) {
        user.googleSub = googleSub;
        user.authProvider = user.passwordHash ? "both" : "google";
      }

      user.emailVerified = true;

      if (!user.name && payload.name) {
        user.name = payload.name;
      }

      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }

      await user.save();
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

// const User=require("../Models/Users");
// const bcrypt=require("bcrypt");
// const jwt=require("jsonwebtoken");

// //Helper to sanitize user object b4 sending t ofrontend
// const sanitizeUser=(user)=>({
//     id:user._id,
//     name:user.name,
//     email:user.email,
//     role:user.role,
//     phone:user.phone,
//     verication_Status:user.verication_Status
// })

// exports.register=async(req,res)=>{
//     try{
//         //Validate fields=None are empty
//         const {name,email,password,role,phone}=req.body;
//         if(!name||!email||!password||!role){
//             return res.status(400).json({message:'All fields are required'})
//         }
//         //Validate email
//         if(!email.match(/^\S+@\S+\.\S+$/)){
//             return res.status(400).json({message:"Invalid Email Format"})
//         }
//         if(password.length<6){
//             return res.status(400).json({message:"Password must be atleast 6 Characters"})
//         }//Check for duplicate email
//         const existingUser=await User.findOne({email:email.toLowerCase().trim()})
//         if (existingUser){
//             return res.status(400).json({message:"Email already in use"})
//         }//Check for dupliacte username
//         const existingUsername=await User.findOne({name:name.toLowerCase().trim()})
//         if(existingUsername){
//             return res.status(400).json({message:"Username already in use"})
//         }
//         //Check for phone Number
//         const existingNumber=await User.findOne({phone:phone.toLowerCase().trim()})
//         if(existingNumber){
//             return res.status(400).json({message:"Phone-Number already in Use"})
//         };
//         //hash password
//         const salt=await bcrypt.genSalt(10);
//         const passwordHash=await bcrypt.hash(password,salt);

//         //Creating a new user baseed on the inputs=Login data
//         const user=new User({name,
//             email:email.toLowerCase().trim(),
//             passwordHash,
//             role,
//             phone:phone || ""})

//         // await user.save();//Runs the Pre.save middleware to hash the password

//         //Craeting a JWT token=Allowing login session
//         const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"})
//         //Return user+token =let frontend Store login
//         res.status(201).json({//send token and data to frontend
//             token,
//         user:{
//             id:user._id,
//             name:user.name,
//             email:user.email,
//             role:user.role,
//             phone:user.phone,
//             verication_Status:user.verication_Status
//         }})
//     }
//     catch(err){
//         res.status(500).json({message:err.message});
//     }
// }

// //LOGIN USer
// exports.login=async(req,res)=>{
//     try{
//         //Read or Obtain data from the frontend
//         const{email,password}=req.body;
//         //Validate input
//         //if no email
//         if(!email||!password){
//             return res.status(400).json({message:"Email and password required"})
//         }
//         //Check if the User exists in database via email and password
//         const user=await User.findOne({email:email.toLowerCase().trim()}).select('+passwordHash')
//         if(!user){
//             return res.status(400).json({message:"Invalid Credentials"})
//         }

//         //Chekc password using th eUSer models comparePassword Method
//         const isMatch=await bcrypt.compare(password,user.passwordHash);
//         if(!isMatch){
//             return res.status(400).json({message:"Ivalid Credentials"})
//         }
//         //Creating JWT token if user signs in successfully
//         const token=await jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});
//         //Send back to frontend
//         res.json({
//             token,
//             user:{
//                 id:user._id,
//                 name:user.name,
//                 email:user.email,
//                 role:user.role,
//                 phone:user.phone,
//                 verification_Status:user.verification_Status
//             }
//         })
//     }
//     catch(err){
//         res.status(500).json({message:err.message})
//     }
// };
// exports.getUserProfile=async(req,res)=>{
//     try{
//         //req.user is set in authMiddleware after token verification
//         const user=await User.findById(req.user.id).select('-password');//Exclude password
//         if(!user){
//             return res.status(404).json({message:"User not found"})
//         }
//         //else send user data-exclude password
//         res.json({user})
//     }
//     catch(err){
//         res.status(500).json({message:err.message})
//     }
// }
// exports.getMe=async(req,res)=>{
//     try{
//         const user=await User.findById(req.user._id).select('-password');
//         res.json({user});
//     }catch(err){
//         res.status(500).json({message:err.message});
//     }
// }
