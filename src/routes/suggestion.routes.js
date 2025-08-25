const { Router } = require('express');
const suggestionController = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/authMiddleware');

const suggestionRoutes = Router();

// Provider logado pode enviar uma nova sugestão
suggestionRoutes.post('/', authMiddleware, suggestionController.createSuggestion);

module.exports = suggestionRoutes;