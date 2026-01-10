import api from './api';

/**
 * Comment API Service
 */
class CommentService {
  /**
   * Lấy tất cả comments của 1 season
   */
  async getSeasonComments(seasonId, page = 1, limit = 10) {
    const response = await api.get(`/comments/season/${seasonId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Lấy tất cả comments của 1 episode
   */
  async getEpisodeComments(episodeId, page = 1, limit = 10) {
    const response = await api.get(`/comments/episode/${episodeId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Lấy replies của 1 comment
   */
  async getCommentReplies(commentId, page = 1, limit = 5) {
    const response = await api.get(`/comments/${commentId}/replies`, {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Tạo comment mới
   */
  async createComment(data) {
    const response = await api.post('/comments', data);
    return response.data;
  }

  /**
   * Toggle like comment
   */
  async toggleLike(commentId, increment = true) {
    const response = await api.post(`/comments/${commentId}/like`, {
      increment
    });
    return response.data;
  }

  /**
   * Xóa comment
   */
  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  }

  /**
   * Lấy chi tiết 1 comment
   */
  async getCommentById(commentId) {
    const response = await api.get(`/comments/${commentId}`);
    return response.data;
  }

  /**
   * Lấy comments của user
   */
  async getUserComments(userId, page = 1, limit = 10) {
    const response = await api.get(`/comments/user/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  }
}

export default new CommentService();
