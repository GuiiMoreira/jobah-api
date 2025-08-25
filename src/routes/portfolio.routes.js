const { Router } = require('express');
const multer = require('multer');
const uploadConfig = require('../config/upload');
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');
const providerMiddleware = require('../middleware/providerMiddleware'); // Assumindo que temos esse middleware

const portfolioRoutes = Router();
const upload = multer(uploadConfig);

portfolioRoutes.use(authMiddleware, providerMiddleware);

// Rota para adicionar uma ou mais imagens (até 5 por vez)
portfolioRoutes.post('/', upload.array('images', 5), portfolioController.addPortfolioImages);

// Rota para remover uma imagem específica
portfolioRoutes.delete('/:imageId', portfolioController.removePortfolioImage);

module.exports = portfolioRoutes;