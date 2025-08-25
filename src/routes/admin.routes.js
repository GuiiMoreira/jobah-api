const { Router } = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const adminRoutes = Router();

adminRoutes.use(authMiddleware, adminMiddleware);

adminRoutes.get('/suggestions', adminController.listSuggestions);
adminRoutes.post('/suggestions/:id/manage', adminController.manageSuggestion);

module.exports = adminRoutes;