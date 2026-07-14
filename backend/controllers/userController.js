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
    }).select('_id username email phone isOnline lastSeen');

    res.json(users);
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ message: error.message || 'Server error searching users' });
  }
};

module.exports = {
  searchUsers,
};
