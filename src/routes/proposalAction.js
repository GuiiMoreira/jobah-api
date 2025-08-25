const { Router } = require('express');
const proposalController = require('../controllers/proposalController');

const proposalActionsRoutes = Router();

// Rota para o cliente aceitar uma proposta específica
proposalActionsRoutes.post('/:proposalId/accept', proposalController.acceptProposal);
proposalActionsRoutes.post('/:proposalId/accept', proposalController.createProposal);
proposalActionsRoutes.post('/:proposalId/accept-and-pay', proposalController.acceptAndPayMock);

module.exports = proposalActionsRoutes;