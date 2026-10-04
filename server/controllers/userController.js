const User = require('../models/User');

// @desc    Get all verified providers (with filtering, searching, sorting)
// @route   GET /api/users/providers
// @access  Public
const getProviders = async (req, res, next) => {
  try {
    const { category, area, search, minRating, sort } = req.query;

    // Base query: Only verified providers
    const query = { role: 'provider', isVerified: true };

    // Apply exact category filter
    if (category) {
      query.category = category;
    }

    // Apply case-insensitive partial match for area
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    // Apply search string to name, category, or bio
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply minimum rating filter
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // Determine sorting
    let sortOptions = { createdAt: -1 }; // Default: newest first
    if (sort === 'rating') {
      sortOptions = { averageRating: -1 };
    } else if (sort === 'priceLow') {
      sortOptions = { price: 1 };
    } else if (sort === 'priceHigh') {
      sortOptions = { price: -1 };
    }

    // Execute query, excluding passwords
    const providers = await User.find(query)
      .sort(sortOptions)
      .select('-password');

    res.status(200).json({
      count: providers.length,
      providers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single verified provider by ID
// @route   GET /api/users/providers/:id
// @access  Public
const getProviderById = async (req, res, next) => {
  try {
    const provider = await User.findOne({
      _id: req.params.id,
      role: 'provider',
      isVerified: true
    }).select('-password');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found or not verified' });
    }

    res.status(200).json({ provider });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract only allowed fields to prevent role/verification/rating manipulation
    const { 
      name, phone, area, profileImage, 
      category, price, experience, bio 
    } = req.body;

    // Update common fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (area) user.area = area;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Update provider-only fields if the user is a provider
    if (user.role === 'provider') {
      if (category) user.category = category;
      if (price !== undefined) user.price = Number(price);
      if (experience !== undefined) user.experience = Number(experience);
      if (bio !== undefined) user.bio = bio;
    }

    const updatedUser = await user.save();
    
    // Remove password from the response
    updatedUser.password = undefined;

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of available service categories
// @route   GET /api/users/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    // These match the enum defined in the User model
    const categories = [
      'Plumber', 
      'Electrician', 
      'AC Repair', 
      'Cleaning', 
      'Painter', 
      'Carpenter', 
      'RO Service'
    ];
    
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProviders,
  getProviderById,
  updateProfile,
  getCategories
};