const { Router } = require('express');

// Importações de todas as rotas
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin.routes');
const reviewRoutes = require('./review.routes');
const walletRoutes = require('./wallet.routes');
const profileRoutes = require('./profile.routes');
const providerRoutes = require('./provider.routes');
const favoritesRoutes = require('./favorite.routes');
const portfolioRoutes = require('./portfolio.routes');
const dashboardRoutes = require('./dashboard.routes');
const payoutInfoRoutes = require('./payoutInfo.routes');
const professionRoutes = require('./profession.routes');
const validationRoutes = require('./validation.routes');
const conversationRoutes = require('./conversation.routes');
const notificationRoutes = require('./notification.routes');
const changeRequestRoutes = require('./changeRequest.routes');
const superCategoryRoutes = require('./superCategory.routes');
const providerSearchRoutes = require('./providerSearch.routes');
const orderChangeRequestRoutes = require('./orderChangeRequest.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/profile', profileRoutes);
router.use('/validate', validationRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/professions', professionRoutes);
router.use('/conversations', conversationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/super-categories', superCategoryRoutes);
router.use('/providers/search', providerSearchRoutes);
router.use('/orders/:orderId/change-requests', orderChangeRequestRoutes);
router.use('/change-requests', changeRequestRoutes);
router.use('/wallet', walletRoutes);
router.use('/payout-info', payoutInfoRoutes)
router.use('/provider', providerRoutes);


module.exports = router;