const mongoose=require("mongoose");
const bcrypt=require("bcrypt");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        minLength:[3,"Username must be atleast 3 Characters Long"],
        maxLength:[20,"Username has too many characters"]
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/,"Please enter a valid email adress"]
    },
    password:{
        type:String,
        required:[true,'Enter a vaid email address'],
        minLength:[6,"Password must be atleast 6 characters Long"],
        select:false//Not visible 
    },
    phone_Number:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        enum:['tenant','landlord','admin'],
        default:tenant,
        required:true,
    },
    building:{//Foreign Key
        type:mongoose.Schema.Types.ObjectId,
        ref:"Building",
        required:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    verication_Status:{
        type:String,
        enum:['verified','unverified','pending'],
        default:'unverified'
    }
},{timestamps:true});

//Pre save middleware/HOOK to hash the password
//.pre('save', ...): registers a pre-save middleware (hook) 
// — code that runs right before Mongoose saves a document
//Before saving a user hash the password
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();//If not modified go to next middleware
    try{
        const salt=await bcrypt.genSalt(10);//Gen Salt
        this.password=await bcrypt.hash(this.password,salt);//Update passord with hshed one
        next();//Go  to next middlware when done
    }
    catch(error){
        next(error)//Show error if occurs
    }
})

//Compare plaintext password and hashed Password for Login
//userSchema.methods=Defining the Instance method
//.comparePasswords=Method name
//userSchema.methods.comparePasswords=Enables each document to check its own password
//.methods=attach function to all user instances
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}
//Exporting
module.exports=mongoose.model("User",userSchema)