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
  },
  settings: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    isPinned: { 
      type: Boolean, 
      default: false 
    },
    isMuted: { 
      type: Boolean, 
      default: false 
    }
  }]
});

ChatSchema.index({ participants: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
