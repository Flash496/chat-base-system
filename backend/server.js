require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const { authenticateSocket } = require('./middleware/auth');

const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// CORS config
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB
connectDB();

// Mount REST routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// Simple diagnostic route
app.get('/', (req, res) => {
  res.send('Chat App API is running...');
});

// Configure Socket.IO
const io = socketIo(server, {
  pingTimeout: 5000,
  pingInterval: 10000,
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Auth middleware for Socket.IO
io.use(authenticateSocket);

// Store mapping of active users to their socket IDs
// (Useful for quickly checking if a participant is online)
const activeUsers = new Map(); // userId -> Set of socketIds

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  console.log(`User connected: ${socket.user.username} (${userId})`);

  // Track socket ID under user
  if (!activeUsers.has(userId)) {
    activeUsers.set(userId, new Set());
  }
  activeUsers.get(userId).add(socket.id);

  // Update online status in MongoDB
  try {
    await User.findByIdAndUpdate(userId, { isOnline: true });
  } catch (err) {
    console.error('Error updating user online status:', err);
  }

  // Join personal room for targeting user-specific direct notifications
  socket.join(userId);

  // Join all chat rooms this user belongs to
  try {
    const userChats = await Chat.find({ participants: socket.user._id });
    userChats.forEach(chat => {
      const chatIdStr = chat._id.toString();
      socket.join(chatIdStr);
      
      // Notify other room participants that this user is online
      socket.to(chatIdStr).emit('presence_update', {
        userId: socket.user._id,
        isOnline: true,
        lastSeen: new Date()
      });
    });
  } catch (err) {
    console.error('Error joining chat rooms on connect:', err);
  }

  // EVENT: Join a newly created chat room
  socket.on('join_room', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} (User: ${socket.user.username}) joined room ${chatId}`);
  });

  // EVENT: Send a message
  socket.on('send_message', async ({ chatId, text }, callback) => {
    try {
      if (!chatId || !text) {
        if (callback) callback({ error: 'ChatId and text are required' });
        return;
      }

      // Validate participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.user._id
      });

      if (!chat) {
        if (callback) callback({ error: 'Not authorized to send message in this chat' });
        return;
      }

      // Check if other participant is online to instantly deliver
      // For DMs, find the other participant's ID
      const recipientId = chat.participants.find(p => p.toString() !== userId);
      const isRecipientOnline = recipientId ? activeUsers.has(recipientId.toString()) : false;
      const initialStatus = isRecipientOnline ? 'delivered' : 'sent';

      // Persist message to database
      const message = await Message.create({
        chatId,
        senderId: socket.user._id,
        text,
        status: initialStatus
      });

      const populatedMessage = await message.populate('senderId', '_id username');

      // Broadcast to room (including sender)
      io.to(chatId).emit('new_message', populatedMessage);

      // Return message to sender via callback acknowledgement
      if (callback) callback({ success: true, message: populatedMessage });
    } catch (err) {
      console.error('Send Message Socket Error:', err);
      if (callback) callback({ error: 'Server error sending message' });
    }
  });

  // EVENT: Message delivered receipt feedback from client
  socket.on('msg_delivered', async ({ messageId, chatId }) => {
    try {
      const updated = await Message.findOneAndUpdate(
        { _id: messageId, status: 'sent' },
        { status: 'delivered' },
        { new: true }
      );
      if (updated) {
        io.to(chatId).emit('message_status_update', {
          messageId,
          status: 'delivered',
          chatId
        });
      }
    } catch (err) {
      console.error('Error updating delivery receipt status:', err);
    }
  });

  // EVENT: Chat opened/read by recipient
  socket.on('read_chat', async ({ chatId }) => {
    try {
      // Update all messages in this chat sent by others to 'read'
      await Message.updateMany(
        { chatId, senderId: { $ne: socket.user._id }, status: { $ne: 'read' } },
        { status: 'read' }
      );

      // Broadcast read event to the room
      io.to(chatId).emit('chat_read', {
        chatId,
        readerId: socket.user._id
      });
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  });

  // EVENT: React to message
  socket.on('react_message', async ({ messageId, chatId, emoji }) => {
    try {
      // Validate participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.user._id
      });
      if (!chat) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Check if user already reacted
      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId.toString() === socket.user._id.toString()
      );

      if (existingReactionIndex > -1) {
        if (message.reactions[existingReactionIndex].emoji === emoji) {
          // Toggle off if same emoji clicked again
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          // Update emoji if different clicked
          message.reactions[existingReactionIndex].emoji = emoji;
        }
      } else {
        // Add new reaction
        message.reactions.push({
          userId: socket.user._id,
          emoji
        });
      }

      await message.save();

      // Broadcast reaction update to the room
      io.to(chatId).emit('message_reaction_update', {
        messageId,
        chatId,
        reactions: message.reactions
      });
    } catch (err) {
      console.error('Error updating reaction:', err);
    }
  });

  // EVENT: Typing indicators
  socket.on('typing', ({ chatId }) => {
    socket.to(chatId).emit('user_typing', {
      chatId,
      userId: socket.user._id,
      username: socket.user.username
    });
  });

  socket.on('stop_typing', ({ chatId }) => {
    socket.to(chatId).emit('user_stop_typing', {
      chatId,
      userId: socket.user._id
    });
  });

  // EVENT: Disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.username} (${userId})`);
    
    const userSockets = activeUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        activeUsers.delete(userId);
        
        // Update database presence
        const lastSeenDate = new Date();
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: lastSeenDate
          });

          // Broadcast offline status to all user's chats
          const userChats = await Chat.find({ participants: socket.user._id });
          userChats.forEach(chat => {
            socket.to(chat._id.toString()).emit('presence_update', {
              userId: socket.user._id,
              isOnline: false,
              lastSeen: lastSeenDate
            });
          });
        } catch (err) {
          console.error('Error saving user disconnect status:', err);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
