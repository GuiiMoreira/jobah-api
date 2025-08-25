const { Router } = require('express');
const payoutInfoController = require('../controllers/payoutInfoController');
const authMiddleware = require('../middleware/authMiddleware');



const payoutInfoRoutes = Router();
payoutInfoRoutes.get('/', authMiddleware, payoutInfoController.getPayoutInfo);
payoutInfoRoutes.put('/', authMiddleware, payoutInfoController.upsertPayoutInfo);

module.exports = payoutInfoRoutes;