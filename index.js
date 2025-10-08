const express = require("express");
const connectDB = require("./config/db");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const jwtAuth = require("./middleware/authMiddleware.middleware");
const authorizedRoles = require("./middleware/roles.middleware");
const adminRoutes = require("./routes/admin.routes");
const bookRoutes = require("./routes/Books.routes");
const path = require("path");
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/images/books", express.static(path.join(__dirname, "public/images/books")));
app.use("/images/sellerAadhar", express.static(path.join(__dirname, "public/images/sellerAadhar")));

dotenv.config();
connectDB();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", bookRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
