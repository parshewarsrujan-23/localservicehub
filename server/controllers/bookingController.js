const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Customer only)
const createBooking = async (req, res, next) => {
  try {
    console.log('BODY:', req.body);
    console.log('FILES:', req.files ? req.files.length : 0);

    const providerId = req.body.provider || req.body.providerId;
    const { category, description, address, area, scheduledDate, scheduledTime } = req.body;

    if (!providerId || !providerId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400);
      throw new Error(`Invalid provider id received: ${providerId}`);
    }

    const provider = await User.findById(providerId);
    console.log('PROVIDER FOUND:', provider ? provider.email : null);

    if (!provider) {
      res.status(404);
      throw new Error('Provider not found');
    }
    if (provider.role !== 'provider') {
      res.status(400);
      throw new Error('This user is not a provider');
    }
    if (!provider.isVerified) {
      res.status(400);
      throw new Error('Provider is not verified yet');
    }

    const problemImages = (req.files || []).map((f) => f.path);

    const booking = await Booking.create({
      customer: req.user._id,
      provider: provider._id,
      category: (category || provider.category).toLowerCase(),
      description,
      problemImages,
      address,
      area,
      scheduledDate,
      scheduledTime,
    });

    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookings (Customer sees theirs, Provider sees assigned)
// @route   GET /api/bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      query.provider = req.user._id;
    } 
    // If admin, returns all bookings if query remains empty

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone area')
      .populate('provider', 'name phone area category')
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone area profileImage')
      .populate('provider', 'name phone area profileImage category');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: only customer, provider of this booking, or admin can view
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isProvider = booking.provider._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Provider only)
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Must belong to this provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Strictly validate status transitions
    const current = booking.status;
    let isValidTransition = false;

    if (current === 'Requested' && status === 'Accepted') isValidTransition = true;
    if (current === 'Accepted' && status === 'In progress') isValidTransition = true;
    if (current === 'In progress' && status === 'Completed') isValidTransition = true;

    if (!isValidTransition) {
      return res.status(400).json({ 
        message: `Invalid status transition from '${current}' to '${status}'.` 
      });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    res.status(200).json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer only)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Must belong to this customer
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Can only cancel if Requested or Accepted
    if (booking.status !== 'Requested' && booking.status !== 'Accepted') {
      return res.status(400).json({ 
        message: `Cannot cancel a booking that is already '${booking.status}'` 
      });
    }

    booking.status = 'Cancelled';
    const updatedBooking = await booking.save();

    res.status(200).json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Provider sends a quote
// @route   PUT /api/bookings/:id/quote
// @access  Private (Provider only)
const sendQuote = async (req, res, next) => {
  try {
    const { price, note } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send a quote for this booking' });
    }

    booking.quote = {
      price: Number(price),
      note: note,
      status: 'Sent'
    };

    const updatedBooking = await booking.save();
    res.status(200).json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer responds to a quote
// @route   PUT /api/bookings/:id/quote/respond
// @access  Private (Customer only)
const respondToQuote = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this quote' });
    }

    if (booking.quote.status !== 'Sent') {
      return res.status(400).json({ message: 'No active quote to respond to' });
    }

    if (action === 'accept') {
      booking.quote.status = 'Accepted';
    } else if (action === 'reject') {
      booking.quote.status = 'Rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action. Use accept or reject' });
    }

    const updatedBooking = await booking.save();
    res.status(200).json({ booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateStatus,
  cancelBooking,
  sendQuote,
  respondToQuote
};