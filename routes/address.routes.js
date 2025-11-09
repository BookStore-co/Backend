const { addAddress, showAddress } = require("../controllers/address.controller");
const express = require("express");
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");

router.post("/addAddress", jwtAuth, addAddress);
router.get("/showAddress", jwtAuth, showAddress);
module.exports = router;
