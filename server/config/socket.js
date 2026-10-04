const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Handle "Bearer <token>" format if sent that way
      if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Join a booking chat room
    socket.on('joinBooking', async (bookingId) => {
      try {
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
          return socket.emit('error', { message: 'Booking not found' });
        }

        const userId = socket.user._id.toString();
        const isCustomer = booking.customer.toString() === userId;
        const isProvider = booking.provider.toString() === userId;

        if (!isCustomer && !isProvider) {
          return socket.emit('error', { message: 'Not authorized to join this chat' });
        }

        socket.join(bookingId);
        console.log(`User ${socket.user.name} joined room: ${bookingId}`);
      } catch (error) {
        socket.emit('error', { message: 'Server error while joining room' });
      }
    });

    // Handle sending a message
    socket.on('sendMessage', async (data) => {
      try {
        const { bookingId, text, image, type } = data;

        // Save message to database
        const message = await Message.create({
          booking: bookingId,
          sender: socket.user._id,
          text,
          image,
          type: type || (image ? 'image' : 'text')
        });

        // Populate sender info before emitting to clients
        const populatedMessage = await message.populate('sender', 'name profileImage role');

        // Emit to everyone in the room (including sender)
        io.to(bookingId).emit('newMessage', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (bookingId) => {
      // Broadcast to everyone else in the room
      socket.to(bookingId).emit('typing', socket.user._id);
    });

    socket.on('stopTyping', (bookingId) => {
      socket.to(bookingId).emit('stopTyping', socket.user._id);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};

module.exports = initSocket;