const { analyzeImageForCategory } = require('../utils/aiHelper');

// @desc    Suggest service category based on uploaded image
// @route   POST /api/ai/suggest-category
// @access  Private
const suggestCategory = async (req, res, next) => {
  try {
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { buffer, mimetype } = req.file;

    // Call the helper function
    const aiSuggestion = await analyzeImageForCategory(buffer, mimetype);

    // Return the JSON directly to the frontend
    res.status(200).json(aiSuggestion);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  suggestCategory,
};