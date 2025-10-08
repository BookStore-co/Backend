const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const register = async (req, res) => {
  const { name, email, password, mobno, role, SellerDetails } = req.body;

  try {
    const userExist = await User.findOne({ email: email, mobno: mobno });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    newStatus = "approved";
    if (role === "seller") {
      newStatus = "pending";
    }
    const newUser = new User({
      name,
      email,
      mobno,
      password: hashedPassword,
      role,
      newStatus,
    });

    if (role === "seller") {
      newUser.SellerDetails = {
        shopName: SellerDetails?.shopName,
        shopAddress: SellerDetails?.shopAddress,
        gstNumber: SellerDetails?.gstNumber,
        aadharNumber: SellerDetails?.aadharNumber,
        panNumber: SellerDetails?.panNumber,
        bankDetails: {
          accountNumber: SellerDetails?.bankDetails?.accountNumber,
          ifscCode: SellerDetails?.bankDetails?.ifscCode,
          bankName: SellerDetails?.bankDetails?.bankName,
          accountHolderName: SellerDetails?.bankDetails?.accountHolderName,
        },
      };
    }

    if(req.files && req.files.aadharFrontImage){
      newUser.SellerDetails.aadharFrontImage = req.files.aadharFrontImage[0].filename
    }

    if(req.files && req.files.aadharBackImage){
      newUser.SellerDetails.aadharBackImage = req.files.aadharBackImage[0].filename;
    }
    await newUser.save();

    res.status(201).json({
      message:
        role === "seller"
          ? "Registration successful, pending admin approval"
          : "Registration successful, you can now log in",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.role === "seller" && user.status === "pending") {
      return res.status(403).json({
        message:
          "Your seller account is still pending approval from the admin.",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        newStatus: user.status,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const dashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const newAddress = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
    };
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.address.push(newAddress);
    await user.save();
    res
      .status(200)
      .json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, addAddress, dashboard };
