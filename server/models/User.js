const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Don't return password by default in queries
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
    },
    role: {
      type: String,
      enum: ['customer', 'provider', 'admin'],
      default: 'customer',
    },
    area: {
      type: String,
      required: [true, 'Please specify your area in Hyderabad'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      // Default is handled dynamically during registration (customer: true, provider: false)
    },
    // Provider specific fields
    category: {
      type: String,
      enum: ['Plumber', 'Electrician', 'AC Repair', 'Cleaning', 'Painter', 'Carpenter', 'RO Service'],
    },
    price: {
      type: Number, // Base/Hourly price representation
    },
    experience: {
      type: Number, // Years of experience
    },
    bio: {
      type: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash if the password was modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);