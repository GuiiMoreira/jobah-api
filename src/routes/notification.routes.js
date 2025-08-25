const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const notificationRoutes = Router();
notificationRoutes.use(authMiddleware);

notificationRoutes.get('/', notificationController.listNotifications);
notificationRoutes.patch('/read', notificationController.markAsRead);
notificationRoutes.delete('/:notificationId', notificationController.deleteNotification);

module.exports = notificationRoutes;