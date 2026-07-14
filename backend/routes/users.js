const express = require('express');
const { searchUsers, updateProfilePic } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/search', protect, searchUsers);
router.put('/profile-pic', protect, updateProfilePic);

module.exports = router;
