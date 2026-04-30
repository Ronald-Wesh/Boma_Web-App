const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    passwordHash: {
      type: String,
      select: false,
      default: null,
    },
    googleSub: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["password", "google", "both"],
      default: "password",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["tenant", "landlord", "admin"],
      default: "tenant",
      required: true,
    },
    // building:{//Foreign Key
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:"Building",
    //     required:true
    // },
    // isVerified: {
    //   type: Boolean,
    //   default: false,
    // },
    verificationStatus: {
      type: String,
      enum: ["verified", "unverified", "pending"],
      default: "unverified",
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

userSchema.virtual("verication_Status")
  .get(function () {
    return this.verificationStatus;
  })
  .set(function (value) {
    this.verificationStatus = value;
  });

// //Pre save middleware/HOOK to hash the password
// //.pre('save', ...): registers a pre-save middleware (hook)
// // — code that runs right before Mongoose saves a document
// //Before saving a user hash the password
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("passwordHash")) return next(); //If not modified go to next middleware
//   try {
//     const salt = await bcrypt.genSalt(10); //Gen Salt
//     this.passwordHash = await bcrypt.hash(this.passwordHash, salt); //Update passord with hshed one
//     next(); //Go  to next middlware when done
//   } catch (error) {
//     next(error); //Show error if occurs
//   }
// });

// //Compare plaintext password and hashed Password for Login
// //userSchema.methods=Defining the Instance method
// //.comparePasswords=Method name
// //userSchema.methods.comparePasswords=Enables each document to check its own password
// //.methods=attach function to all user instances
// userSchema.methods.comparePassword = async function (passwordHash) {
//   return await bcrypt.compare(passwordHash, this.passwordHash);
// };
//Exporting
module.exports = mongoose.model("User", userSchema);
