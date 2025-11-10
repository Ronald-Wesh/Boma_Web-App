const mongoose = require('mongoose');
const { default: Building } = require('./Building');

const ListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be a positive number"],
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  images: [
    {
      type: String
    }
  ],
  
},{timestamps:true});

module.exports=mongoose.model("Listing",ListingSchema);