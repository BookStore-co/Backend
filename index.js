const express = require("express");
const connectDB = require("./config/db");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const ordersRoutes = require("./routes/order.route");
const booksRoutes = require("./routes/Books.routes");

const path = require("path");
const cors = require("cors");

dotenv.config();
connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  "/images/books",
  express.static(path.join(__dirname, "public/images/books"))
);
app.use(
  "/images/sellerAadhar",
  express.static(path.join(__dirname, "public/images/sellerAadhar"))
);

app.use(express.json());
app.use(cookieParser());

// mount routers with matching variables
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", ordersRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
