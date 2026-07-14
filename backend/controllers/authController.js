const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configure Nodemailer Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  try {
    // Check if username taken
    const userExists = await User.findOne({ username });
    if (userExists) {
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

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user. (Password will be hashed in User Schema pre-save hook)
    const user = await User.create({
      username,
      passwordHash: password, // Schema pre-save handles hashing
      email: email || undefined,
      phone: phone || undefined,
      isEmailVerified: false,
      isPhoneVerified: false,
      verificationOtp: {
        code: otpCode,
        expiresAt
      }
    });

    if (user) {
      // Send OTP via Gmail SMTP if email is provided
      if (email) {
        try {
          await transporter.sendMail({
            from: `"ProtoChat" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your ProtoChat Account',
            html: `
              <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #e7e4de; background-color: #faf8f5;">
                <h2 style="color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Verify Account</h2>
                <p style="color: #334155; font-size: 14px;">Your 6-digit One-Time Password (OTP) code is:</p>
                <div style="background-color: #3b0764; color: #ffffff; padding: 12px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; border-radius: 4px;">
                  ${otpCode}
                </div>
                <p style="color: #8c9ba5; font-size: 11px; margin-top: 15px;">This OTP will expire in 10 minutes.</p>
              </div>
            `
          });
        } catch (mailErr) {
          console.error('Failed to send registration OTP email:', mailErr);
        }
      }

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic || '',
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
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
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Private
const verifyOtp = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verificationOtp || user.verificationOtp.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    if (new Date() > user.verificationOtp.expiresAt) {
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    // Mark as verified
    if (user.email) user.isEmailVerified = true;
    if (user.phone) user.isPhoneVerified = true;

    user.verificationOtp = undefined; // Clear OTP
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profilePic: user.profilePic || '',
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: error.message || 'Server error verifying OTP' });
  }
};

// @desc    Resend OTP code
// @route   POST /api/auth/resend-otp
// @access  Private
const resendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOtp = {
      code: otpCode,
      expiresAt
    };
    await user.save();

    // Send email via Gmail SMTP
    if (user.email) {
      try {
        await transporter.sendMail({
          from: `"ProtoChat" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Verify your ProtoChat Account',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #e7e4de; background-color: #faf8f5;">
              <h2 style="color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Verify Account</h2>
              <p style="color: #334155; font-size: 14px;">Your new 6-digit One-Time Password (OTP) code is:</p>
              <div style="background-color: #3b0764; color: #ffffff; padding: 12px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; border-radius: 4px;">
                ${otpCode}
              </div>
              <p style="color: #8c9ba5; font-size: 11px; margin-top: 15px;">This OTP will expire in 10 minutes.</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send resend OTP email:', mailErr);
      }
    }

    res.json({ message: 'A new verification code has been transmitted.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: error.message || 'Server error resending OTP' });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
};
