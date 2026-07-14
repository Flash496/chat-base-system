const express = require('express');
const { searchUsers, updateProfilePic, blockUser, unblockUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/search', protect, searchUsers);
router.put('/profile-pic', protect, updateProfilePic);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);

module.exports = router;
