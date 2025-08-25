const { Router } = require('express');
const authController = require('../controllers/authController');

const authRoutes = Router();

authRoutes.post('/signup', authController.signup);
authRoutes.post('/login', authController.login);
authRoutes.post('/forgot-password', authController.forgotPassword);
authRoutes.post('/reset-password', authController.resetPassword);

module.exports = authRoutes;