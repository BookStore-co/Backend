const express = require('express');
const router = express.Router();
const { register, login, addAddress, dashboard } = require("../controllers/auth.controller");
const jwtAuth = require("../middleware/authMiddleware.middleware");
const upload = require("../middleware/upload.middleware");

router.post('/register',upload.fields([
    { name: 'profileImg', maxCount: 1 },
    { name: 'aadharFrontImage', maxCount: 1 },
    { name: 'aadharBackImage', maxCount: 1 }
]), register);
router.post('/login', login); 
router.post('/add-address',jwtAuth, addAddress); 
router.get('/dashboard', jwtAuth, dashboard);

module.exports = router;