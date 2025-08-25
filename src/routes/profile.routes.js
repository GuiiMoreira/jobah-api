const { Router } = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const profileRoutes = Router();

// Todas as rotas aqui exigem que o usuário esteja logado
profileRoutes.use(authMiddleware);

// Rotas para o prestador gerenciar suas profissões
profileRoutes.post('/professions', profileController.addProfessionToProfile);
profileRoutes.delete('/professions/:id', profileController.removeProfessionFromProfile);
profileRoutes.patch('/verification', profileController.submitVerificationData);
profileRoutes.patch('/professions/:id', profileController.updateProfileProfession);



module.exports = profileRoutes;