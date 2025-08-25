const { Router } = require('express');
const professionController = require('../controllers/professionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const professionRoutes = Router();

professionRoutes.get('/', professionController.getAllProfessions);


professionRoutes.post('/', authMiddleware, adminMiddleware, professionController.createProfession);
professionRoutes.delete('/:id', authMiddleware, adminMiddleware, professionController.deleteProfession);

module.exports = professionRoutes;