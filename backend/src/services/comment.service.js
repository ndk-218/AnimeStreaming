const Comment = require('../models/Comment');
const Episode = require('../models/Episode');

class CommentService {
  /**
   * Tạo comment mới (gốc hoặc reply)
   */
  async createComment({ userId, seriesId, seasonId, episodeId, content, parentCommentId = null, mentionedUser = null }) {
    // Validate episode tồn tại (chỉ khi episodeId được cung cấp)
    if (episodeId) {
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        throw new Error('Episode không tồn tại');
      }
    }

    // Xác định depth của comment
    let depth = 1;
    let parentComment = null;

    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId)
        .populate('userId', 'displayName username');
      if (!parentComment) {
        throw new Error('Comment cha không tồn tại');
      }

      // Depth mới = depth của parent + 1, nhưng max là 3
      depth = Math.min(parentComment.depth + 1, 3);
      
      // Nếu parent đã ở depth 3, reply sẽ cùng level 3
      if (parentComment.depth === 3) {
        depth = 3;
      }
    }

    // Tạo comment
    const comment = new Comment({
      userId,
      seriesId,
      seasonId,
      episodeId: episodeId || null, // Cho phép null
      content,
      mentionedUser: mentionedUser || null, // Accept from request
      parentCommentId,
      depth,
      likeCount: 0,
      replyCount: 0
    });

    await comment.save();

    // Nếu là reply, tăng replyCount của parent
    if (parentCommentId && parentComment) {
      parentComment.replyCount += 1;
      await parentComment.save();
    }

    // Populate user info và episode info trước khi return
    await comment.populate('userId', 'username displayName avatar');
    
    // Chỉ populate episodeId nếu nó không null
    if (episodeId) {
      await comment.populate('episodeId', 'episodeNumber title');
    }
    
    // TRIGGER NOTIFICATION: Nếu là reply, gửi notification cho mentioned user
    if (parentCommentId) {
      try {
        const notificationService = require('./notification.service');
        const result = await notificationService.createCommentReplyNotification(comment._id);
        console.log('📢 Comment reply notification result:', result);
      } catch (notifError) {
        console.error('⚠️ Failed to send comment notification:', notifError.message);
        console.error(notifError.stack);
        // Don't throw - notification failure shouldn't break comment creation
      }
    }
    
    return comment;
  }

  /**
   * Lấy tất cả comments gốc của 1 season (depth = 1)
   * Có phân trang
   */
  async getSeasonComments(seasonId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      seasonId,
      depth: 1 // Chỉ lấy comments gốc
    })
      .populate('userId', 'username displayName avatar')
      .populate('episodeId', 'episodeNumber title')
      .sort({ createdAt: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({
      seasonId,
      depth: 1
    });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy tất cả comments gốc của 1 episode (depth = 1)
   * Có phân trang
   */
  async getEpisodeComments(episodeId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      episodeId,
      depth: 1 // Chỉ lấy comments gốc
    })
      .populate('userId', 'username displayName avatar')
      .populate('episodeId', 'episodeNumber title')
      .sort({ createdAt: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({
      episodeId,
      depth: 1
    });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy replies của 1 comment
   * Có phân trang (5 replies/lần)
   */
  async getCommentReplies(commentId, page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const replies = await Comment.find({
      parentCommentId: commentId
    })
      .populate('userId', 'username displayName avatar')
      .populate('episodeId', 'episodeNumber title')
      .sort({ createdAt: 1 }) // Cũ nhất trước (theo thứ tự thời gian)
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({
      parentCommentId: commentId
    });

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Toggle like comment (không lưu trạng thái user)
   */
  async toggleLike(commentId, increment = true) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment không tồn tại');
    }

    // Tăng hoặc giảm likeCount
    if (increment) {
      comment.likeCount += 1;
    } else {
      comment.likeCount = Math.max(0, comment.likeCount - 1); // Không cho âm
    }

    await comment.save();
    return comment;
  }

  /**
   * Xóa comment (chỉ user tạo comment mới được xóa)
   */
  async deleteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment không tồn tại');
    }

    // Check quyền: chỉ user tạo comment mới xóa được
    if (comment.userId.toString() !== userId.toString()) {
      throw new Error('Bạn không có quyền xóa comment này');
    }

    // Nếu là reply, giảm replyCount của parent
    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(
        comment.parentCommentId,
        { $inc: { replyCount: -1 } }
      );
    }

    // Xóa tất cả replies của comment này (cascade delete)
    await Comment.deleteMany({ parentCommentId: commentId });

    // Xóa comment
    await comment.deleteOne();

    return { message: 'Xóa comment thành công' };
  }

  /**
   * Lấy thông tin chi tiết 1 comment
   */
  async getCommentById(commentId) {
    const comment = await Comment.findById(commentId)
      .populate('userId', 'username displayName avatar')
      .populate('episodeId', 'episodeNumber title')
      .populate('seasonId', 'title seasonNumber')
      .populate('seriesId', 'title slug');

    if (!comment) {
      throw new Error('Comment không tồn tại');
    }

    return comment;
  }

  /**
   * Lấy tất cả comments của 1 user
   */
  async getUserComments(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ userId })
      .populate('episodeId', 'episodeNumber title')
      .populate('seriesId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ userId });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new CommentService();
