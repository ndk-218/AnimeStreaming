const commentService = require('../services/comment.service');

class CommentController {
  /**
   * POST /api/comments
   * Tạo comment mới
   */
  async createComment(req, res) {
    try {
      const { seriesId, seasonId, episodeId, content, parentCommentId, mentionedUser } = req.body;
      const userId = req.user._id; // Lấy từ auth middleware

      // Validation
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nội dung comment không được để trống'
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Nội dung comment không được vượt quá 1000 ký tự'
        });
      }

      const comment = await commentService.createComment({
        userId,
        seriesId,
        seasonId,
        episodeId,
        content: content.trim(),
        parentCommentId,
        mentionedUser: mentionedUser || null
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/comments/season/:seasonId
   * Lấy tất cả comments gốc của season
   */
  async getSeasonComments(req, res) {
    try {
      const { seasonId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await commentService.getSeasonComments(seasonId, page, limit);

      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get season comments error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/comments/episode/:episodeId
   * Lấy tất cả comments gốc của episode
   */
  async getEpisodeComments(req, res) {
    try {
      const { episodeId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await commentService.getEpisodeComments(episodeId, page, limit);

      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get episode comments error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/comments/:commentId/replies
   * Lấy replies của 1 comment
   */
  async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;

      const result = await commentService.getCommentReplies(commentId, page, limit);

      res.json({
        success: true,
        data: result.replies,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get comment replies error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/comments/:commentId/like
   * Toggle like comment
   */
  async toggleLike(req, res) {
    try {
      const { commentId } = req.params;
      const { increment } = req.body; // true = like, false = unlike

      const comment = await commentService.toggleLike(commentId, increment);

      res.json({
        success: true,
        data: {
          commentId: comment._id,
          likeCount: comment.likeCount
        }
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * Xóa comment
   */
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;

      const result = await commentService.deleteComment(commentId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(403).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/comments/:commentId
   * Lấy chi tiết 1 comment
   */
  async getCommentById(req, res) {
    try {
      const { commentId } = req.params;
      const comment = await commentService.getCommentById(commentId);

      res.json({
        success: true,
        data: comment
      });
    } catch (error) {
      console.error('Get comment by id error:', error);
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/comments/user/:userId
   * Lấy tất cả comments của user
   */
  async getUserComments(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await commentService.getUserComments(userId, page, limit);

      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user comments error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CommentController();
