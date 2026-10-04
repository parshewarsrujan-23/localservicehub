const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  getProviders, 
  getProviderById, 
  updateProfile, 
  getCategories 
} = require('../controllers/userController');

// Public routes
router.get('/providers', getProviders);
router.get('/providers/:id', getProviderById);
router.get('/categories', getCategories);

// Protected routes
router.put('/profile', protect, updateProfile);

module.exports = router;