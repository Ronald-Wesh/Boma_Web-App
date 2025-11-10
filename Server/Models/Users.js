const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");

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
        select:false
    },
    role:{
        type:String,
        enum:['tenant','landlord','admin'],
        default:tenant
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
userSchema.pre('save',async function(next){ 
    // Only hash if the password is new or changed
        if(!this.isModified('password')) return next();
        try {
            const salt=await bcrypt.genSalt(10);//Make salt
            this.password=await bcrypt.hash(this.password,salt)//hash the passowrd
            next();
            }catch(error){
                next(error)
            };
});;

//Compare password for login
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password);
};
module.exports=mongoosee.model("User",userSchema);

