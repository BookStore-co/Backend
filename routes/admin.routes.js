const express = require('express');
const router = express.Router();
const jwtAuth = require("../middleware/authMiddleware.middleware");
const authorizedRoles = require("../middleware/roles.middleware");
const { allUsers, getSellers, getPendingSellers, acceptSellerRequest, rejectSellerRequest, everyOne, getSellerById, deleteSeller} = require("../controllers/admin.controller");

router.get('/everyOne', jwtAuth, authorizedRoles('admin'), everyOne);
router.get('/getUsers', jwtAuth, authorizedRoles('admin'), allUsers);
router.get('/getSellers',jwtAuth, authorizedRoles('admin'), getSellers);
router.get('/getPendingSellers', jwtAuth, authorizedRoles('admin'), getPendingSellers);
router.post('/approvePendingRequest/:sellerId', jwtAuth, authorizedRoles('admin'), acceptSellerRequest);
router.post('/rejectPendingRequest/:sellerId', jwtAuth, authorizedRoles('admin'), rejectSellerRequest);
router.get('/getSellerById/:sellerId', jwtAuth, authorizedRoles('admin'),getSellerById);
router.delete('/deleteSeller/:sellerId', jwtAuth, authorizedRoles('admin'), deleteSeller);

module.exports = router;