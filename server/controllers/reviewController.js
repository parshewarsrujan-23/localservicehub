const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Helper function to recalculate and update a provider's average rating and total reviews
const updateProviderStats = async (providerId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
      {
        $group: {
          _id: '$provider',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(providerId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: stats[0].totalReviews,
      });
    } else {
      // If no reviews left, reset stats
      await User.findByIdAndUpdate(providerId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }
  } catch (error) {
    console.error('Error updating provider stats:', error);
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Customer only)
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Must belong to this customer
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Must be completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({ message: 'Only completed bookings can be reviewed' });
    }

    // Must not be already reviewed
    if (booking.isReviewed) {
      return res.status(400).json({ message: 'Booking has already been reviewed' });
    }

    const review = await Review.create({
      booking: bookingId,
      customer: req.user._id,
      provider: booking.provider,
      rating: Number(rating),
      comment,
    });

    // Update booking status
    booking.isReviewed = true;
    await booking.save();

    // Recalculate provider stats
    await updateProviderStats(booking.provider);

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews of a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public
const getProviderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .sort({ createdAt: -1 }) // Newest first
      .populate('customer', 'name profileImage');

    res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private (Admin only)
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('customer', 'name')
      .populate('provider', 'name')
      .populate('booking', 'category');

    res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin only)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const providerId = review.provider;
    const bookingId = review.booking;

    await Review.findByIdAndDelete(req.params.id);

    // Optional: Reset booking isReviewed status so it can be reviewed again
    await Booking.findByIdAndUpdate(bookingId, { isReviewed: false });

    // Recalculate provider stats after deletion
    await updateProviderStats(providerId);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProviderReviews,
  getAllReviews,
  deleteReview,
};