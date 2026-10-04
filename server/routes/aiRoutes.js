const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { suggestCategory } = require('../controllers/aiController');

// Set up Multer with Memory Storage (we don't want to save this to Cloudinary, just analyze it)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// Protected route handling single image upload for AI analysis
router.post('/suggest-category', protect, upload.single('image'), suggestCategory);

module.exports = router;