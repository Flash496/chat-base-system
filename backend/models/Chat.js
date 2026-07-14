const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  isGroup: { 
    type: Boolean, 
    default: false 
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Chat', ChatSchema);
