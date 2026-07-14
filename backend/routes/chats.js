const express = require('express');
const { getChats, createChat, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.get('/:chatId/messages', protect, getMessages);

module.exports = router;
