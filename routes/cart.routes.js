const express = require('express');
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const { addToCart, showInCart, removeFromCart, updateCartItem, checkOut } = require("../controllers/cart.controller");

router.post('/addToCart', jwtAuth, addToCart);
router.get('/showInCart', jwtAuth, showInCart);
router.delete('/removeFromKart/:bookId', jwtAuth, removeFromCart);
router.put('/update-cart', jwtAuth, updateCartItem);
router.post('/checkout', jwtAuth, checkOut);
module.exports = router;