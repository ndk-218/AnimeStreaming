const mongoose = require('mongoose');

// ===== CHAT CONVERSATION SCHEMA =====
const chatConversationSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Messages array
    messages: [{
      role: {
        type: String,
        enum: ['user', 'ai'],
        required: true
      },
      message: {
        type: String,
        required: true,
        maxlength: 1000  // Giới hạn 1000 ký tự/message
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Last message timestamp (để sort)
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    // Auto delete timestamp (createdAt + 3 days)
    autoDeleteAt: {
      type: Date,
      required: true,
      default: function() {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return threeDaysFromNow;
      },
      index: true
    }
  },
  {
    timestamps: true,  // createdAt, updatedAt
    versionKey: false
  }
);

// ===== TTL INDEX - Auto delete sau 3 ngày =====
// MongoDB sẽ tự động xóa documents khi autoDeleteAt < current time
chatConversationSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });

// ===== PRE-SAVE HOOK - Set autoDeleteAt =====
// Note: default function already handles this, but keeping for consistency
chatConversationSchema.pre('save', function(next) {
  // Only update lastMessageAt if messages changed
  if (this.isModified('messages')) {
    this.lastMessageAt = new Date();
  }
  next();
});

// ===== METHODS =====

/**
 * Add message to conversation
 * @param {String} role - 'user' hoặc 'ai'
 * @param {String} message - Nội dung message
 */
chatConversationSchema.methods.addMessage = async function(role, message) {
  // Giới hạn max 50 messages
  if (this.messages.length >= 50) {
    // Xóa message cũ nhất
    this.messages.shift();
  }
  
  // Thêm message mới
  this.messages.push({
    role,
    message: message.substring(0, 1000), // Đảm bảo max 1000 chars
    timestamp: new Date()
  });
  
  // Update lastMessageAt
  this.lastMessageAt = new Date();
  
  await this.save();
  return this;
};

/**
 * Clear all messages
 */
chatConversationSchema.methods.clearMessages = async function() {
  this.messages = [];
  this.lastMessageAt = new Date();
  await this.save();
  return this;
};

/**
 * Get messages for AI context (format cho Gemini API)
 */
chatConversationSchema.methods.getMessagesForAI = function() {
  return this.messages.map(msg => ({
    role: msg.role,
    message: msg.message
  }));
};

// ===== STATICS =====

/**
 * Find or create conversation for user
 * @param {ObjectId} userId - User ID
 * @returns {ChatConversation} - Existing hoặc new conversation
 */
chatConversationSchema.statics.findOrCreateForUser = async function(userId) {
  // Tìm conversation hiện tại (chưa hết hạn 3 ngày)
  let conversation = await this.findOne({
    userId,
    autoDeleteAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
  
  // Nếu không có, tạo mới
  if (!conversation) {
    conversation = await this.create({
      userId,
      messages: []
    });
  }
  
  return conversation;
};

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
