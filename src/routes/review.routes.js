const { Router } = require('express');
const multer = require('multer');
const uploadConfig = require('../config/upload');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

const reviewRoutes = Router();
const upload = multer(uploadConfig);

reviewRoutes.get('/provider/:providerId', reviewController.listReviewsForProvider);
reviewRoutes.post('/', authMiddleware, upload.array('photos', 5), reviewController.createReview);
reviewRoutes.delete('/:reviewId', authMiddleware, reviewController.deleteReview);


module.exports = reviewRoutes;