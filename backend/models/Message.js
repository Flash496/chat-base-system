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
  }
});

module.exports = mongoose.model('Message', MessageSchema);
