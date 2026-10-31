const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/pin/status', AuthController.getPinStatus);
router.post('/pin/verify', AuthController.verifyPin);
router.post('/pin/set', AuthController.setPin);
router.post('/pin/disable', AuthController.disablePin);

module.exports = router;
