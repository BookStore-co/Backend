const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const register = async (req, res) => {
  const { name, email, password, mobno, role } = req.body;

  try {
    const userExist = await User.findOne({ email: email, mobno: mobno });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      mobno,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res)=>{
    const { email, password } = req.body;

    
    try {
        const user = await User.findOne({ email: email });
        if(!user){ return res.status(400).json({ message: "Invalid credentials" }); }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){return res.status(400).json({ message: "Invalid credentials" }); }

        const token = jwt.sign(
            {id: user._id,
            role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.cookie(
            "token", token,
            {httpOnly: true,
            maxAge: 3600000}
        )
        

        res.status(200).json({ message: "Login successful", token,  });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = { register, login };
