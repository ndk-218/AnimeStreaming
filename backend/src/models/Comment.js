const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // User info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content references
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
  episodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode',
    required: false, // Optional - null khi comment từ SeriesDetail page
    default: null
  },
  
  // Comment content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000 // Giới hạn 1000 ký tự
  },
  
  // Mentioned user (for replies) - stored separately from content
  mentionedUser: {
    type: String,
    default: null // null = no mention, string = username mentioned
  },
  
  // Comment hierarchy
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // null = comment gốc, có giá trị = reply
  },
  depth: {
    type: Number,
    default: 1, // 1 = gốc, 2 = reply level 1, 3 = reply level 2
    min: 1,
    max: 3
  },
  
  // Engagement
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  replyCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// Indexes để tăng tốc query
commentSchema.index({ seasonId: 1, createdAt: -1 }); // Lấy comments của season, sort by time
commentSchema.index({ episodeId: 1, createdAt: -1 }); // Lấy comments của episode, sort by time
commentSchema.index({ parentCommentId: 1, createdAt: 1 }); // Lấy replies của 1 comment
commentSchema.index({ userId: 1 }); // Lấy comments của user

// Virtual để populate user info
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual để populate episode info
commentSchema.virtual('episode', {
  ref: 'Episode',
  localField: 'episodeId',
  foreignField: '_id',
  justOne: true
});

// Đảm bảo virtuals được include khi convert to JSON
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
