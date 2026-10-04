const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    problemImages: {
      type: [String],
      validate: [arrayLimit, 'Exceeds the limit of 3 images'],
    },
    address: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Requested', 'Accepted', 'In progress', 'Completed', 'Cancelled'],
      default: 'Requested',
    },
    quote: {
      price: {
        type: Number,
      },
      note: {
        type: String,
      },
      status: {
        type: String,
        enum: ['None', 'Sent', 'Accepted', 'Rejected'],
        default: 'None',
      },
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Custom validator to limit array size to 3
function arrayLimit(val) {
  return val.length <= 3;
}

module.exports = mongoose.model('Booking', bookingSchema);