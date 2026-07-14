const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { username, password, email, phone } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!email && !phone) {
    return res.status(400).json({ message: 'Either email or phone number is required to register' });
  }

  try {
    // Check if username taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Check if email taken
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    // Check if phone taken
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number is already registered' });
      }
    }

    // Create user. (Password will be hashed in User Schema pre-save hook)
    const user = await User.create({
      username,
      passwordHash: password, // Schema pre-save handles hashing
      email: email || undefined,
      phone: phone || undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic || '',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier (email or phone) and password are required' });
  }

  try {
    // Search by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return profile & token
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profilePic: user.profilePic || '',
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

module.exports = {
  register,
  login,
};
