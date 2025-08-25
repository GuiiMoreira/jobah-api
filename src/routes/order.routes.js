const { Router } = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

const orderRoutes = Router();

// Todas as rotas de pedido exigem autenticação
orderRoutes.use(authMiddleware);

orderRoutes.post('/', orderController.createOrder);
orderRoutes.get('/', orderController.listOrders);
orderRoutes.patch('/:id/status', orderController.updateOrderStatus);
orderRoutes.post('/:orderId/confirm-payment', orderController.confirmPaymentMock);
orderRoutes.post('/:orderId/pix-payment', paymentController.generatePixForOrder);

module.exports = orderRoutes;