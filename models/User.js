const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: Number, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobno: { type: Number, required: true , unique: true, min: 1000000000, max: 9999999999 },
  date: { type: Date, default: Date.now },
  address: [addressSchema],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
