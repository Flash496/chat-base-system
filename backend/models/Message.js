const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat',
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
});

MessageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
