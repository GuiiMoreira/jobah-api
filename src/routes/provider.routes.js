const { Router } = require('express');
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middleware/authMiddleware');
const providerMiddleware = require('../middleware/providerMiddleware');

const providerRoutes = Router();

providerRoutes.use(authMiddleware);

providerRoutes.put('/services/:serviceId', providerMiddleware, providerController.updateMyService);

module.exports = providerRoutes;