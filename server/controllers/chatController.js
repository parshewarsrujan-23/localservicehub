const Message = require('../models/Message');
const Booking = require('../models/Booking');

// @desc    Get all messages for a specific booking
// @route   GET /api/chat/:bookingId
// @access  Private (Customer or Provider of the booking)
const getMessages = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization
    const userId = req.user._id.toString();
    const isCustomer = booking.customer.toString() === userId;
    const isProvider = booking.provider.toString() === userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Fetch messages sorted oldest to newest
    const messages = await Message.find({ booking: bookingId })
      .populate('sender', 'name profileImage role')
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload an image for the chat
// @route   POST /api/chat/upload
// @access  Private
const uploadChatImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // req.file.path contains the Cloudinary URL
    res.status(200).json({ url: req.file.path });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  uploadChatImage
};