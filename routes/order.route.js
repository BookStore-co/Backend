const { fetchOrdersBySeller, fetchOrderbyorderId, cancelOrder } = require("../controllers/order.controller");
const express = require("express");
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const authorizedRoles = require("../middleware/roles.middleware");

router.get("/fetchOrdersBySeller", jwtAuth, authorizedRoles("seller"), fetchOrdersBySeller);
router.get("/fetchOrderbyorderId/:id", jwtAuth, fetchOrderbyorderId);
router.put("/cancelOrder/:id", jwtAuth, cancelOrder);

module.exports = router;
