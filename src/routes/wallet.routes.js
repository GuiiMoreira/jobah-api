const { Router } = require('express');
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

const walletRoutes = Router();

walletRoutes.get('/dashboard', authMiddleware, walletController.getWalletDashboard);
walletRoutes.post('/withdraw', authMiddleware, walletController.requestWithdrawal);


module.exports = walletRoutes;