const { Router } = require('express');
const superCategoryController = require('../controllers/superCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const superCategoryRoutes = Router();

// Rota pública para listar
superCategoryRoutes.get('/', superCategoryController.listAllWithProfessions);
superCategoryRoutes.get('/all', superCategoryController.getAllSuperCategories);
superCategoryRoutes.get('/:id', superCategoryController.getSuperCategoryById);

// Rota de admin para criar
superCategoryRoutes.post('/', authMiddleware, adminMiddleware, superCategoryController.createSuperCategory);

module.exports = superCategoryRoutes;