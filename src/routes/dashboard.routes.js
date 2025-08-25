const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');

const dashboardRoutes = Router();

// Rota pública para os dados do dashboard/home do app
dashboardRoutes.get('/', dashboardController.getDashboardData);

module.exports = dashboardRoutes;