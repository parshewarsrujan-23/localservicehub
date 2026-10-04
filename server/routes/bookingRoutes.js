const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateStatus,
  cancelBooking,
  sendQuote,
  respondToQuote
} = require('../controllers/bookingController');

// All booking routes require authentication
router.use(protect);

// Customer creates a booking (up to 3 images handled by multer)
router.post('/', authorize('customer'), upload.array('images', 3), createBooking);

// Get my bookings (Customers get theirs, Providers get theirs)
router.get('/', getMyBookings);

// Get specific booking details
router.get('/:id', getBookingById);

// Provider updates booking status
router.put('/:id/status', authorize('provider'), updateStatus);

// Customer cancels booking
router.put('/:id/cancel', authorize('customer'), cancelBooking);

// Provider sends quote
router.put('/:id/quote', authorize('provider'), sendQuote);

// Customer responds to quote
router.put('/:id/quote/respond', authorize('customer'), respondToQuote);

module.exports = router;