const { Router } = require('express');
const proposalController = require('../controllers/proposalController');
const authMiddleware = require('../middleware/authMiddleware');
const authMiddleware = require('../middleware/providerMiddleware');


const proposalForOrderRoutes = Router({ mergeParams: true });

// Rota para o prestador criar uma proposta para um pedido
proposalForOrderRoutes.post('/', authMiddleware, providerMiddleware, proposalController.createProposal);

module.exports = proposalForOrderRoutes;