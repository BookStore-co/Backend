const mongoose = require("mongoose");
const addressSchema = require("./Address");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobno: { type: Number, required: true , unique: true, min: 1000000000, max: 9999999999 },
  date: { type: Date, default: Date.now },
  address: [addressSchema],
  role: { type: String, enum: ['user', 'admin', 'seller'], default: 'user' },
  status:{type: String , enum: ['pending', 'approved', 'rejected'], default: 'pending'},
  profileImg: { type: String },
  SellerDetails: {
    shopName: { type: String },
    shopAddress: { type: String },
    aadharNumber: { type: String },
    aadharFrontImage: { type: String },
    aadharBackImage: { type: String },
    panNumber: { type: String },
    gstNumber: { type: String },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String }, 
      accountHolderName: { type: String }
    }
  }

});

const User = mongoose.model("User", userSchema);

module.exports = User;
