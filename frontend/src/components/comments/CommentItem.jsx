import { useState } from 'react';
import { Heart, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import PropTypes from 'prop-types';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Component hiển thị 1 comment
 * Theme: White + Cyan + Pink
 * Simple vertical thread line
 */
const CommentItem = ({ 
  comment,
  currentUser,
  onReply,
  onDelete,
  onToggleLike,
  onLoadReplies,
  depth = 1
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.replyCount > 0);

  // Like state (local - chỉ trong session này)
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  // Format thời gian
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: vi
  });

  // Check nếu user là owner của comment
  // Support both _id and id from authStore
  const currentUserId = currentUser?._id || currentUser?.id;
  const commentUserId = comment.userId?._id || comment.userId?.id;
  const isOwner = currentUser && currentUserId === commentUserId;

  // Handle submit reply
  const handleReplySubmit = async (content, mentionedUser) => {
    try {
      const newReply = await onReply(comment._id, content, mentionedUser);
      
      // Add reply vào list
      setReplies([...replies, newReply]);
      setShowReplyForm(false);
      setShowReplies(true); // Auto show replies sau khi reply
      
      // Update reply count
      comment.replyCount += 1;
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  // Handle load replies
  const handleLoadReplies = async () => {
    if (isLoadingReplies) return;

    setIsLoadingReplies(true);
    try {
      const result = await onLoadReplies(comment._id, replyPage);
      
      setReplies([...replies, ...result.data]);
      setReplyPage(replyPage + 1);
      setShowReplies(true);
      
      // Check if has more replies
      setHasMoreReplies(result.pagination.page < result.pagination.totalPages);
    } catch (error) {
      console.error('Load replies error:', error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  // Handle toggle like (new logic)
  const handleLike = async () => {
    if (isLiking) return; // Prevent spam clicking

    setIsLiking(true);
    
    try {
      const newLikedState = !isLiked;
      
      // Update UI immediately (optimistic update)
      setIsLiked(newLikedState);
      setLocalLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      // Call API
      await onToggleLike(comment._id, newLikedState);
      
    } catch (error) {
      console.error('Toggle like error:', error);
      // Rollback on error
      setIsLiked(!isLiked);
      setLocalLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    
    try {
      await onDelete(comment._id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Display name (ưu tiên displayName, fallback về username)
  const displayName = comment.userId?.displayName || comment.userId?.username || 'Unknown User';

  // Avatar URL với fallback
  const getAvatarUrl = () => {
    if (comment.userId?.avatar) {
      // Check if avatar is full URL or relative path
      if (comment.userId.avatar.startsWith('http')) {
        return comment.userId.avatar;
      }
      // Nếu bắt đầu với /uploads hoặc /assets thì thêm base URL
      if (comment.userId.avatar.startsWith('/uploads') || comment.userId.avatar.startsWith('/assets')) {
        return `${import.meta.env.VITE_API_URL}${comment.userId.avatar}`;
      }
      // Nếu không có / ở đầu thì thêm /
      if (!comment.userId.avatar.startsWith('/')) {
        return `${import.meta.env.VITE_API_URL}/${comment.userId.avatar}`;
      }
      return `${import.meta.env.VITE_API_URL}${comment.userId.avatar}`;
    }
    // Default avatar với tên hiển thị
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=34D0F4&color=fff`;
  };

  // Check if has replies to show thread line
  const hasRepliesOrForm = (showReplies && replies.length > 0) || comment.replyCount > 0;

  return (
    <div className={`flex gap-3 ${depth > 1 ? 'ml-12' : ''}`}>
      {/* Avatar with simple vertical thread line */}
      <div className="flex-shrink-0 relative">
        <img
          src={getAvatarUrl()}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 relative z-10 bg-white"
          onError={(e) => {
            // Fallback nếu avatar load lỗi
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=34D0F4&color=fff`;
          }}
        />
        
        {/* Simple vertical thread line */}
        {hasRepliesOrForm && (
          <div 
            className="absolute left-5 top-10 w-px bg-[#34D0F4]/30"
            style={{ 
              height: showReplies 
                ? `calc(100% - 40px)` // Khi mở replies: kéo dài đến button "Ẩn phản hồi"
                : '20px' // Khi đóng replies: chỉ ngắn đến button "Xem phản hồi"
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Username (Darker Cyan), Time, Episode badge */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-[#0EA5C9]">
            {displayName}
          </span>
          
          {/* Badge tập phim - Pink gradient (chỉ hiển khi có episodeId) */}
          {comment.episodeId && comment.episodeId.episodeNumber && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full font-medium">
              Tập {comment.episodeId.episodeNumber}
            </span>
          )}
          
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>

        {/* Comment content with separate mention */}
        <div className="text-gray-700 text-sm mb-2 whitespace-pre-wrap break-words">
          {comment.mentionedUser && (
            <span className="text-[#FA7299] font-semibold">{comment.mentionedUser} </span>
          )}
          <span>{comment.content}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 text-xs mb-2">
          {/* Like button with animation */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-200
              ${isLiked 
                ? 'border-[#FA7299] text-[#FA7299] bg-pink-50' 
                : 'border-gray-300 text-gray-500 hover:border-[#FA7299] hover:text-[#FA7299]'
              }
              ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Heart 
              size={14} 
              className={`transition-all duration-200 ${isLiked ? 'fill-[#FA7299]' : ''}`}
            />
            <span className="font-medium">{localLikeCount > 0 && localLikeCount}</span>
          </button>

          {/* Reply button (chỉ hiện nếu chưa đạt max depth) */}
          {depth < 3 && currentUser && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-gray-500 hover:text-[#34D0F4] transition-colors"
            >
              <MessageSquare size={14} />
              <span>Trả lời</span>
            </button>
          )}

          {/* Delete button (chỉ owner) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 mb-3">
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder="Viết bình luận"
              isReply={true}
              autoFocus={true}
              parentCommentUser={displayName}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Show replies button */}
        {comment.replyCount > 0 && !showReplies && (
          <button
            onClick={handleLoadReplies}
            disabled={isLoadingReplies}
            className="text-sm text-[#0EA5C9] hover:text-[#0891B2] transition-colors flex items-center gap-2 font-medium"
          >
            {isLoadingReplies ? (
              <>
                <div className="w-4 h-4 border-2 border-[#34D0F4] border-t-transparent rounded-full animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <MessageSquare size={14} />
                <span>Xem {comment.replyCount} phản hồi</span>
              </>
            )}
          </button>
        )}

        {/* Replies list */}
        {showReplies && replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                onDelete={onDelete}
                onToggleLike={onToggleLike}
                onLoadReplies={onLoadReplies}
                depth={depth + 1}
              />
            ))}

            {/* Load more replies */}
            {hasMoreReplies && (
              <button
                onClick={handleLoadReplies}
                disabled={isLoadingReplies}
                className="text-sm text-[#0EA5C9] hover:text-[#0891B2] transition-colors font-medium"
              >
                {isLoadingReplies ? 'Đang tải...' : 'Xem thêm phản hồi'}
              </button>
            )}
          </div>
        )}

        {/* Hide replies button */}
        {showReplies && replies.length > 0 && (
          <button
            onClick={() => setShowReplies(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Ẩn phản hồi
          </button>
        )}
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  onReply: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleLike: PropTypes.func.isRequired,
  onLoadReplies: PropTypes.func.isRequired,
  depth: PropTypes.number
};

export default CommentItem;
