const express = require('express');
const { getChats, createChat, getMessages, pinChat, muteChat, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getChats);
router.post('/', protect, createChat);
router.get('/:chatId/messages', protect, getMessages);
router.put('/:id/pin', protect, pinChat);
router.put('/:id/mute', protect, muteChat);
router.delete('/:id', protect, deleteChat);

module.exports = router;
