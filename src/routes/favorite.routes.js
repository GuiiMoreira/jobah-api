const { Router } = require('express');
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

const favoriteRoutes = Router();

// Todas as rotas de favoritos exigem que o usuário esteja logado
favoriteRoutes.use(authMiddleware);

// Lista os favoritos do usuário logado
favoriteRoutes.get('/', favoriteController.listFavorites);

// Adiciona um prestador aos favoritos
favoriteRoutes.post('/:providerId', favoriteController.addFavorite);

// Remove um prestador dos favoritos
favoriteRoutes.delete('/:providerId', favoriteController.removeFavorite);


module.exports = favoriteRoutes;