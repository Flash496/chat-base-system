const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get user conversations (chat list)
// @route   GET /api/chats
// @access  Private
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    }).populate('participants', '_id username email phone profilePic isOnline lastSeen');

    const chatsWithMetadata = await Promise.all(chats.map(async (chat) => {
      // Find latest message in this conversation
      const lastMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .populate('senderId', '_id username');

      // Count unread messages sent by others
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        senderId: { $ne: req.user._id },
        status: { $ne: 'read' }
      });

      return {
        ...chat.toObject(),
        lastMessage,
        unreadCount
      };
    }));

    // Sort: Pinned chats float to the top, then sort by latest message/chat creation date
    chatsWithMetadata.sort((a, b) => {
      const aSettings = a.settings?.find(s => s.userId.toString() === req.user._id.toString());
      const bSettings = b.settings?.find(s => s.userId.toString() === req.user._id.toString());
      
      const aPinned = aSettings ? aSettings.isPinned : false;
      const bPinned = bSettings ? bSettings.isPinned : false;

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
      return dateB - dateA;
    });

    res.json(chatsWithMetadata);
  } catch (error) {
    console.error('Get Chats Error:', error);
    res.status(500).json({ message: error.message || 'Server error retrieving chats' });
  }
};

// @desc    Create or reuse a 1-on-1 chat
// @route   POST /api/chats
// @access  Private
const createChat = async (req, res) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient ID is required' });
  }

  if (recipientId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot start a chat session with yourself' });
  }

  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    // Look for existing 1-on-1 chat
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, recipientId], $size: 2 }
    }).populate('participants', '_id username email phone profilePic isOnline lastSeen');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat if not found
    chat = await Chat.create({
      isGroup: false,
      participants: [req.user._id, recipientId]
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', '_id username email phone profilePic isOnline lastSeen');

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Create Chat Error:', error);
    res.status(500).json({ message: error.message || 'Server error creating chat' });
  }
};

// @desc    Get paginated messages for a chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 40;
  const skip = (page - 1) * limit;

  try {
    // Confirm user is a participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to view messages in this chat' });
    }

    // Load recent messages, populating replyTo and its senderId
    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', '_id username')
      .populate({
        path: 'replyTo',
        populate: { path: 'senderId', select: '_id username' }
      });

    // Return in chronological order (oldest to newest)
    res.json(messages.reverse());
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ message: error.message || 'Server error retrieving messages' });
  }
};

// @desc    Toggle pin status for a chat
// @route   PUT /api/chats/:id/pin
// @access  Private
const pinChat = async (req, res) => {
  const { id } = req.params;
  try {
    const chat = await Chat.findOne({ _id: id, participants: req.user._id });
    if (!chat) {
      return res.status(403).json({ message: 'Unauthorized action on this conversation' });
    }

    let userSettings = chat.settings.find(s => s.userId.toString() === req.user._id.toString());
    if (!userSettings) {
      chat.settings.push({ userId: req.user._id, isPinned: true });
    } else {
      userSettings.isPinned = !userSettings.isPinned;
    }

    await chat.save();
    res.json(chat);
  } catch (error) {
    console.error('Pin Chat Error:', error);
    res.status(500).json({ message: error.message || 'Server error pinning chat' });
  }
};

// @desc    Toggle mute status for a chat
// @route   PUT /api/chats/:id/mute
// @access  Private
const muteChat = async (req, res) => {
  const { id } = req.params;
  try {
    const chat = await Chat.findOne({ _id: id, participants: req.user._id });
    if (!chat) {
      return res.status(403).json({ message: 'Unauthorized action on this conversation' });
    }

    let userSettings = chat.settings.find(s => s.userId.toString() === req.user._id.toString());
    if (!userSettings) {
      chat.settings.push({ userId: req.user._id, isMuted: true });
    } else {
      userSettings.isMuted = !userSettings.isMuted;
    }

    await chat.save();
    res.json(chat);
  } catch (error) {
    console.error('Mute Chat Error:', error);
    res.status(500).json({ message: error.message || 'Server error muting chat' });
  }
};

// @desc    Delete a chat and its messages
// @route   DELETE /api/chats/:id
// @access  Private
const deleteChat = async (req, res) => {
  const { id } = req.params;
  try {
    const chat = await Chat.findOne({ _id: id, participants: req.user._id });
    if (!chat) {
      return res.status(403).json({ message: 'Unauthorized action on this conversation' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId: chat._id });
    
    // Delete the chat itself
    await Chat.findByIdAndDelete(chat._id);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete Chat Error:', error);
    res.status(500).json({ message: error.message || 'Server error deleting chat' });
  }
};

module.exports = {
  getChats,
  createChat,
  getMessages,
  pinChat,
  muteChat,
  deleteChat,
};
