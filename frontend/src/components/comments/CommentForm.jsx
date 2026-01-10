import { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Form để viết comment hoặc reply
 * Theme: White + Cyan + Pink (matching platform design)
 */
const CommentForm = ({ 
  onSubmit, 
  placeholder = 'Viết bình luận',
  isReply = false,
  autoFocus = false,
  parentCommentUser = null,
  onCancel = null
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const maxLength = 1000;
  const remainingChars = maxLength - content.length;

  // Danh sách emoji phổ biến
  const emojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤩',
    '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
    '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝',
    '🤤', '😒', '😓', '😔', '😕', '😖', '🙃', '😲', '☹️', '🙁',
    '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩',
    '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡',
    '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠',
    '🥳', '🥸', '😎', '🤓', '🧐', '😈', '👿', '👻', '💀', '☠️',
    '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽',
    '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
    '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
    '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌',
    '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💫', '💦', '💨', '🌈',
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️',
    '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Pass content as-is (no prepending)
      // mentionedUser will be sent separately if reply
      await onSubmit(content.trim(), parentCommentUser || null);
      setContent(''); // Clear form sau khi submit thành công
      setShowEmojiPicker(false); // Đóng emoji picker
    } catch (error) {
      console.error('Submit comment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit với Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Đóng emoji picker khi nhấn Escape
    if (e.key === 'Escape' && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    // Thêm emoji vào vị trí con trỏ
    const textarea = document.getElementById(`comment-textarea-${isReply ? 'reply' : 'main'}`);
    const cursorPos = textarea.selectionStart;
    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);
    const newContent = textBefore + emoji + textAfter;
    
    if (newContent.length <= maxLength) {
      setContent(newContent);
      
      // Focus lại textarea và đặt con trỏ sau emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Reply indicator */}
      {isReply && parentCommentUser && (
        <div className="mb-2 text-sm text-gray-600">
          Trả lời <span className="text-[#FA7299] font-medium">{parentCommentUser}</span>
        </div>
      )}

      {/* Textarea container */}
      <div className="relative bg-white rounded-lg border-2 border-gray-200 focus-within:border-[#34D0F4] transition-colors">
        <textarea
          id={`comment-textarea-${isReply ? 'reply' : 'main'}`}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 px-4 py-3 pr-24 resize-none focus:outline-none min-h-[80px] max-h-[200px]"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#34D0F4 #f3f4f6'
          }}
        />

        {/* Emoji Picker Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3 w-80 max-h-64 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Chọn emoji</span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar with emoji and send button */}
        <div className="flex items-center justify-between px-4 pb-3 border-t border-gray-100">
          {/* Left: Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`transition-colors p-1 ${
              showEmojiPicker 
                ? 'text-[#34D0F4]' 
                : 'text-gray-400 hover:text-[#34D0F4]'
            }`}
            title="Chọn emoji"
          >
            <Smile size={20} />
          </button>

          {/* Right: Character count + Send button */}
          <div className="flex items-center gap-3">
            {/* Character counter */}
            <span className={`text-xs ${
              remainingChars < 100 
                ? 'text-[#FA7299]' 
                : 'text-gray-500'
            }`}>
              {remainingChars < 100 && `${remainingChars} / ${maxLength}`}
            </span>

            {/* Cancel button (chỉ hiện khi là reply) */}
            {isReply && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hủy
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className={`
                flex items-center gap-2 px-4 py-1.5 rounded-md font-medium text-sm
                transition-all duration-200
                ${content.trim() && !isSubmitting
                  ? 'bg-gradient-to-r from-[#34D0F4] to-[#4DD9FF] text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Gửi (Ctrl + Enter)"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <span>Gửi</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500">
        Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Enter</kbd> để gửi nhanh
        {showEmojiPicker && <span className="ml-2">• <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">Esc</kbd> để đóng emoji</span>}
      </div>
    </form>
  );
};

CommentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isReply: PropTypes.bool,
  autoFocus: PropTypes.bool,
  parentCommentUser: PropTypes.string,
  onCancel: PropTypes.func
};

export default CommentForm;
