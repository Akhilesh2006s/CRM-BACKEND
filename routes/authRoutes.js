const express = require('express');
const router = express.Router();
const { register, login, getMe, firebaseLogin } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/firebase-login', firebaseLogin);
router.get('/me', authMiddleware, getMe);

module.exports = router;

