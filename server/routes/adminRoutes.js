const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
  getPendingProviders,
  verifyProvider,
  rejectProvider,
  getAllUsers,
  deleteUser,
  getStats,
} = require('../controllers/adminController');

// All admin routes are protected and require admin role
router.use(protect, authorize('admin'));

// Provider approval routes
router.get('/providers/pending', getPendingProviders);
router.put('/providers/:id/verify', verifyProvider);
router.delete('/providers/:id', rejectProvider);

// User management routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Dashboard stats route
router.get('/stats', getStats);

module.exports = router;