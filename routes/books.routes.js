const express = require('express');
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const authorizedRoles = require("../middleware/roles.middleware");
const { createBook, showBooks, deleteBook } = require("../controllers/book.controller");
const upload = require("../middleware/upload.middleware");

router.post('/createBook', upload.single("coverImage"), jwtAuth, authorizedRoles('seller'), createBook);
router.get('/showBooks', jwtAuth, showBooks);
router.get('/deleteBook/:id', jwtAuth, authorizedRoles('admin', 'seller'), deleteBook);
module.exports = router;