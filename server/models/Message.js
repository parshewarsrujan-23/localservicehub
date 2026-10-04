const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      // Optional because a message could be just an image
    },
    image: {
      type: String, // Cloudinary URL
    },
    type: {
      type: String,
      enum: ['text', 'image', 'quote'],
      default: 'text',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);