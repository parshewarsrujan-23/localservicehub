const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

// Connect to database
connectDB();

const app = express();

// Create HTTP server (required for Socket.io later)
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json()); // Parse incoming JSON requests

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to LocalServiceHub API' });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});