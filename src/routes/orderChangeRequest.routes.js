const { Router } = require('express');
const changeRequestController = require('../controllers/orderChangeRequestController');
const authMiddleware = require('../middleware/authMiddleware');


// Usamos { mergeParams: true } para acessar o :orderId da rota pai
const orderChangeRequestRoutes = Router({ mergeParams: true });
orderChangeRequestRoutes.use(authMiddleware);
orderChangeRequestRoutes.post('/', changeRequestController.createChangeRequest);
orderChangeRequestRoutes.get('/', changeRequestController.listChangeRequestsForOrder);

module.exports = orderChangeRequestRoutes;