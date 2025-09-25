const express = require("express");
const connectDB = require("./config/db");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const jwtAuth = require("./middleware/authMiddleware.middleware");
const authorizedRoles = require("./middleware/roles.middleware");

dotenv.config();
connectDB();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
// heeekln
app.get("/api/admindash", jwtAuth, authorizedRoles("admin"), (req, res) => {
  res.send("API is running...");
});
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
