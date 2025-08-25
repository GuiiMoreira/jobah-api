const { Router } = require('express');
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

const conversationRoutes = Router();
conversationRoutes.use(authMiddleware);

conversationRoutes.post('/', conversationController.initiateConversation);
conversationRoutes.get('/', conversationController.listConversations);
conversationRoutes.get('/:id/messages', conversationController.getMessages);

module.exports = conversationRoutes;