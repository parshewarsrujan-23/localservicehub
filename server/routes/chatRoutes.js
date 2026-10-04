const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const { getMessages, uploadChatImage } = require('../controllers/chatController');

// Multer + Cloudinary Configuration specific for Chat
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'localservicehub/chat',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

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

// Protected routes
router.use(protect);

// Note: The order matters. /upload must come before /:bookingId so "upload" isn't treated as an ID
router.post('/upload', upload.single('image'), uploadChatImage);
router.get('/:bookingId', getMessages);

module.exports = router;