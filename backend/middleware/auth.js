const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      console.error('REST Auth Middleware Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    // Strip "Bearer " prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket Auth Middleware Error:', error);
    return next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = { protect, authenticateSocket };
