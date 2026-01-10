import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import commentService from '../../services/comment.service';
import useAuthStore from '../../stores/authStore';

/**
 * Component chính cho comment section
 * Theme: White + Cyan + Pink (matching platform design)
 * Comments are SHARED across entire SEASON (not per episode)
 */
const CommentSection = ({ episodeId, seriesId, seasonId }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  // Load comments khi seasonId thay đổi
  useEffect(() => {
    loadComments();
  }, [seasonId]); // Comments theo season, không theo episode

  /**
   * Load comments của SEASON (không phải episode)
   */
  const loadComments = async (pageNum = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Load theo seasonId thay vì episodeId
      const result = await commentService.getSeasonComments(seasonId, pageNum, 10);
      
      if (pageNum === 1) {
        setComments(result.data);
      } else {
        setComments([...comments, ...result.data]);
      }
      
      setPage(pageNum);
      setTotalComments(result.pagination.total);
      setHasMore(result.pagination.page < result.pagination.totalPages);
    } catch (err) {
      console.error('Load comments error:', err);
      setError('Không thể tải bình luận. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit comment mới
   */
  const handleSubmitComment = async (content) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      const commentData = {
        seriesId,
        seasonId,
        content
      };
      
      // Chỉ thêm episodeId nếu nó không null (từ WatchPage)
      if (episodeId) {
        commentData.episodeId = episodeId;
      }
      
      const result = await commentService.createComment(commentData);

      // Add comment mới vào đầu list
      setComments([result.data, ...comments]);
      setTotalComments(totalComments + 1);
    } catch (err) {
      console.error('Create comment error:', err);
      alert('Không thể gửi bình luận. Vui lòng thử lại.');
      throw err;
    }
  };

  /**
   * Reply to comment
   */
  const handleReply = async (parentCommentId, content, mentionedUser = null) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để trả lời');
      return;
    }

    try {
      const replyData = {
        seriesId,
        seasonId,
        content,
        parentCommentId,
        mentionedUser // Pass mentioned user
      };
      
      // Chỉ thêm episodeId nếu nó không null
      if (episodeId) {
        replyData.episodeId = episodeId;
      }
      
      const result = await commentService.createComment(replyData);

      return result.data;
    } catch (err) {
      console.error('Reply error:', err);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
      throw err;
    }
  };

  /**
   * Delete comment
   */
  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      
      // Remove comment from list
      setComments(comments.filter(c => c._id !== commentId));
      setTotalComments(totalComments - 1);
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('Không thể xóa bình luận. Vui lòng thử lại.');
      throw err;
    }
  };

  /**
   * Toggle like comment
   */
  const handleToggleLike = async (commentId, increment) => {
    try {
      await commentService.toggleLike(commentId, increment);
    } catch (err) {
      console.error('Toggle like error:', err);
    }
  };

  /**
   * Load replies của comment
   */
  const handleLoadReplies = async (commentId, page = 1) => {
    try {
      const result = await commentService.getCommentReplies(commentId, page, 5);
      return result;
    } catch (err) {
      console.error('Load replies error:', err);
      throw err;
    }
  };

  /**
   * Load more comments
   */
  const handleLoadMore = () => {
    loadComments(page + 1);
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-300 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b-2 border-gray-200">
        <MessageSquare size={18} className="text-[#34D0F4]" />
        <span className="font-semibold text-gray-900">Bình luận ({totalComments})</span>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Login prompt hoặc Comment form */}
        {!isAuthenticated ? (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#34D0F4]/10 to-[#FA7299]/10 rounded-lg border-2 border-[#34D0F4]">
            <p className="text-gray-700 text-center">
              Vui lòng{' '}
              <a href="/login" className="text-[#34D0F4] hover:text-[#2AB8DC] font-semibold underline">
                đăng nhập
              </a>{' '}
              để tham gia bình luận.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <CommentForm
              onSubmit={handleSubmitComment}
              placeholder="Viết bình luận"
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && comments.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-[#34D0F4] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Comments list */}
        {!isLoading && comments.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUser={user}
                onReply={handleReply}
                onDelete={handleDelete}
                onToggleLike={handleToggleLike}
                onLoadReplies={handleLoadReplies}
                depth={1}
              />
            ))}
          </div>
        )}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white rounded-lg hover:shadow-lg transition-all"
            >
              Xem thêm bình luận
            </button>
          </div>
        )}

        {/* Loading more */}
        {isLoading && comments.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-4 border-[#34D0F4] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

CommentSection.propTypes = {
  episodeId: PropTypes.string.isRequired,
  seriesId: PropTypes.string.isRequired,
  seasonId: PropTypes.string.isRequired
};

export default CommentSection;
