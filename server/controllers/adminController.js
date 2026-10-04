const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get pending providers
// @route   GET /api/admin/providers/pending
// @access  Private (Admin only)
const getPendingProviders = async (req, res, next) => {
  try {
    const providers = await User.find({ role: 'provider', isVerified: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ providers });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a provider
// @route   PUT /api/admin/providers/:id/verify
// @access  Private (Admin only)
const verifyProvider = async (req, res, next) => {
  try {
    const provider = await User.findById(req.params.id);

    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.isVerified = true;
    await provider.save();

    res.status(200).json({ message: 'Provider verified successfully', provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject (delete) a pending provider
// @route   DELETE /api/admin/providers/:id
// @access  Private (Admin only)
const rejectProvider = async (req, res, next) => {
  try {
    const provider = await User.findById(req.params.id);

    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Provider rejected and removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting another admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete an admin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProviders, totalBookings, totalReviews] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'provider' }),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);

    res.status(200).json({
      users: totalUsers,
      providers: totalProviders,
      bookings: totalBookings,
      reviews: totalReviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingProviders,
  verifyProvider,
  rejectProvider,
  getAllUsers,
  deleteUser,
  getStats,
};