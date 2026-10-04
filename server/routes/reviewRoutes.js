const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  createReview,
  getProviderReviews,
  getAllReviews,
  deleteReview,
} = require('../controllers/reviewController');

// Public route for seeing provider reviews
router.get('/provider/:providerId', getProviderReviews);

// Protected routes
router.use(protect);

// Customer creates a review
router.post('/', authorize('customer'), createReview);

// Admin review management
router.get('/', authorize('admin'), getAllReviews);
router.delete('/:id', authorize('admin'), deleteReview);

module.exports = router;