const { Router } = require('express');
const multer = require('multer');
const uploadConfig = require('../config/upload');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const userRoutes = Router();
const upload = multer(uploadConfig);

// --- ROTA PÚBLICA ---
// Qualquer pessoa (logada ou não) pode ver o perfil de um prestador.
userRoutes.get('/:id/profile', userController.getPublicProfile);

// --- ROTAS PRIVADAS ---
// As rotas abaixo exigem que o usuário esteja autenticado.
userRoutes.get('/me', authMiddleware, userController.getProfile);
userRoutes.patch('/me', authMiddleware, userController.updateProfile);
userRoutes.delete('/me', authMiddleware, userController.deleteProfile);
userRoutes.patch('/me/avatar', authMiddleware, upload.single('avatar'), userController.updateAvatar);
userRoutes.patch('/me/password', authMiddleware, userController.changePassword);
userRoutes.get('/me/reviews/given', authMiddleware, userController.getGivenReviews);
userRoutes.get('/me/reviews/received', authMiddleware, userController.getReceivedReviews);
userRoutes.delete('/me', userController.deactivateAccount);


module.exports = userRoutes;