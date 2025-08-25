const { Router } = require('express');
const changeRequestController = require('../controllers/orderChangeRequestController');
const authMiddleware = require('../middleware/authMiddleware');

const changeRequestRoutes = Router();

changeRequestRoutes.use(authMiddleware);
changeRequestRoutes.patch('/:requestId/resolve', changeRequestController.resolveChangeRequest);

module.exports = changeRequestRoutes;