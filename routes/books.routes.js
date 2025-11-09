const express = require('express');
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const authorizedRoles = require("../middleware/roles.middleware");
const { createBook, showBooks, deleteBook, showBooksBySeller, showBookById } = require("../controllers/book.controller");
const upload = require("../middleware/upload.middleware");

router.post('/createBook', upload.single("coverImage"), jwtAuth, authorizedRoles('seller'), createBook);
router.get('/showBooks', jwtAuth, showBooks);
router.get('/deleteBook/:id', jwtAuth, authorizedRoles('admin', 'seller'), deleteBook);
router.get('/showBooksBySeller/:sellerId', jwtAuth, authorizedRoles('seller'), showBooksBySeller);
router.get('/showBookById/:id', showBookById);
module.exports = router;