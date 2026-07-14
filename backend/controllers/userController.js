const User = require('../models/User');

// @desc    Search users by username (partial) or phone (exact)
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query parameter "query" is required' });
  }

  try {
    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude self
        {
          $or: [
            { username: { $regex: searchRegex } },
            { phone: query }
          ]
        }
      ]
    }).select('_id username email phone profilePic isOnline lastSeen');

    res.json(users);
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ message: error.message || 'Server error searching users' });
  }
};

// @desc    Update user profile picture
// @route   PUT /api/users/profile-pic
// @access  Private
const updateProfilePic = async (req, res) => {
  const { profilePic } = req.body;

  if (profilePic === undefined) {
    return res.status(400).json({ message: 'profilePic field is required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic },
      { new: true }
    ).select('_id username email phone profilePic isOnline lastSeen');

    res.json(user);
  } catch (error) {
    console.error('Update Profile Pic Error:', error);
    res.status(500).json({ message: error.message || 'Server error updating profile picture' });
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
const blockUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.blockedUsers.includes(id)) {
      user.blockedUsers.push(id);
      await user.save();
    }

    res.json({ message: 'User blocked successfully', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ message: error.message || 'Server error blocking user' });
  }
};

// @desc    Unblock a user
// @route   POST /api/users/:id/unblock
// @access  Private
const unblockUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blockedUsers = user.blockedUsers.filter(b => b.toString() !== id);
    await user.save();

    res.json({ message: 'User unblocked successfully', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({ message: error.message || 'Server error unblocking user' });
  }
};

module.exports = {
  searchUsers,
  updateProfilePic,
  blockUser,
  unblockUser,
};
