const express = require('express');
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const { addToCart, showInCart, removeFromCart, updateCartItem, checkOut, verifyPayment } = require("../controllers/cart.controller");

router.post('/addToCart', jwtAuth, addToCart);
router.get('/showInCart', jwtAuth, showInCart);
router.delete('/removeFromKart/:bookId', jwtAuth, removeFromCart);
router.put('/update-cart', jwtAuth, updateCartItem);
router.post('/checkout', jwtAuth, checkOut);
router.post('/verify-payment', jwtAuth, verifyPayment); 
module.exports = router;