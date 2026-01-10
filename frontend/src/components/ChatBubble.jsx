import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import geminiService from '../services/geminiService';
import chatService from '../services/chatService';
import { processAnimeResponse } from '../utils/animeParser';
import useAuthStore from '../stores/authStore';

/**
 * ChatBubble Component
 * AI Chatbot cho anime recommendations
 */
const ChatBubble = () => {
  // ===== AUTH CHECK =====
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [messages, setMessages] = useState([]);
  const [processedMessages, setProcessedMessages] = useState([]); // Processed messages with links
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // ===== LOAD CONVERSATION ON MOUNT =====
  useEffect(() => {
    if (isOpen) {
      loadConversation();
    }
  }, [isOpen]);
  
  // ===== AUTO SCROLL TO BOTTOM =====
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // ===== PROCESS AI MESSAGES WITH ANIME LINKS =====
  useEffect(() => {
    const processMessages = async () => {
      const processed = await Promise.all(
        messages.map(async (msg) => {
          if (msg.role === 'ai') {
            // Process AI message to extract anime names and add links
            const segments = await processAnimeResponse(msg.message);
            return {
              ...msg,
              segments // Array of {type, content, url}
            };
          }
          // User messages không cần process
          return msg;
        })
      );
      setProcessedMessages(processed);
    };
    
    if (messages.length > 0) {
      processMessages();
    } else {
      setProcessedMessages([]);
    }
  }, [messages]);
  
  // ===== LOAD CONVERSATION FROM BACKEND =====
  const loadConversation = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await chatService.getConversation();
      
      if (response.success && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Load conversation error:', error);
      // Nếu chưa login hoặc error, khởi tạo empty
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // ===== SCROLL TO BOTTOM =====
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // ===== HANDLE SEND MESSAGE =====
  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    
    if (!trimmedMessage) return;
    if (isLoading) return;
    
    // Validate length
    if (trimmedMessage.length > 1000) {
      setError('Tin nhắn quá dài (tối đa 1000 ký tự)');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        message: trimmedMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Save user message to backend
      await chatService.addUserMessage(trimmedMessage);
      
      // Get conversation history for AI context
      const historyResponse = await chatService.getHistory();
      const fullHistory = historyResponse.data?.messages || [];
      
      // ===== HYBRID APPROACH: Optimize context =====
      let conversationHistory;
      if (fullHistory.length <= 6) {
        // Short conversation → send full history
        conversationHistory = fullHistory;
      } else {
        // Long conversation → send only last 6 messages (3 Q&A pairs)
        conversationHistory = fullHistory.slice(-6);
      }
      
      // Call Gemini API with optimized context
      const aiResponse = await geminiService.sendMessage(
        trimmedMessage,
        conversationHistory
      );
      
      // Add AI response to UI
      const aiMessage = {
        role: 'ai',
        message: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI response to backend
      await chatService.addAIResponse(aiResponse);
      
    } catch (error) {
      console.error('Send message error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Không thể gửi tin nhắn. Vui lòng thử lại.';
      
      if (error.message.includes('overloaded') || error.message.includes('quá tải')) {
        errorMessage = 'Server AI đang quá tải. Vui lòng đợi 5-10 giây rồi thử lại. 🔄';
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        errorMessage = 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi vài giây. ⏱️';
      }
      
      setError(errorMessage);
      
      // Remove user message if error
      setMessages(prev => prev.slice(0, -1));
      setInputMessage(trimmedMessage);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // ===== HANDLE CLEAR CONVERSATION =====
  const handleClearConversation = async () => {
    try {
      setIsLoading(true);
      
      // Clear backend
      await chatService.clearConversation();
      
      // Clear UI
      setMessages([]);
      setError(null);
      setShowClearConfirm(false);
      
    } catch (error) {
      console.error('Clear conversation error:', error);
      setError('Không thể xóa cuộc trò chuyện.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ===== HANDLE ENTER KEY =====
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // ===== TOGGLE CHAT WINDOW =====
  const toggleChat = () => {
    // Check authentication
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus input when open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  // ===== HANDLE LOGIN NAVIGATION =====
  const handleLogin = () => {
    setShowLoginPrompt(false);
    navigate('/profile'); // Navigate to profile page (will show login)
  };
  
  // ===== RENDER MESSAGE CONTENT =====
  const renderMessageContent = (msg) => {
    // User messages - plain text
    if (msg.role === 'user') {
      return (
        <p className="text-sm whitespace-pre-wrap break-words">
          {msg.message}
        </p>
      );
    }
    
    // AI messages - with clickable anime links
    if (msg.segments && msg.segments.length > 0) {
      return (
        <div className="text-sm whitespace-pre-wrap break-words">
          {msg.segments.map((segment, idx) => {
            if (segment.type === 'link' && segment.url) {
              // Clickable anime name
              return (
                <Link
                  key={idx}
                  to={segment.url}
                  className="text-cyan-600 hover:text-cyan-700 font-semibold underline decoration-2 hover:decoration-cyan-600 transition-colors"
                  onClick={() => setIsOpen(false)} // Close chat when clicking link
                >
                  {segment.content}
                </Link>
              );
            }
            // Plain text
            return <span key={idx}>{segment.content}</span>;
          })}
        </div>
      );
    }
    
    // Fallback - plain text
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {msg.message}
      </p>
    );
  };
  
  // ===== RENDER =====
  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* ===== LOGIN PROMPT POPUP ===== */}
      {showLoginPrompt && (
        <div className="mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Đăng nhập để sử dụng Chatbot
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn cần đăng nhập để sử dụng tính năng AI tư vấn anime. 
              Chúng tôi sẽ lưu lại lịch sử trò chuyện của bạn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition font-medium"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div className="mb-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 relative">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Anime AI Assistant</h3>
                <p className="text-xs text-white/80">Tư vấn anime cho bạn</p>
              </div>
            </div>
            
            {/* Clear button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isLoading || messages.length === 0}
              className="p-2 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              title="Xóa cuộc trò chuyện"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <span className="text-5xl mb-4">💬</span>
                <p className="text-sm">Chưa có tin nhắn nào</p>
                <p className="text-xs mt-2">Hãy hỏi tôi về anime bạn muốn xem!</p>
              </div>
            ) : (
              <>
                {processedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {renderMessageContent(msg)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Confirm Clear Popup - Fixed position overlay */}
          {showClearConfirm && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
              <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
Xóa cuộc trò chuyện?</h3>
                <p className="text-sm text-gray-600 mb-6">
Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleClearConversation}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          
          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-sm"
                maxLength={1000}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Gửi'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {inputMessage.length}/1000 ký tự
            </p>
          </div>
        </div>
      )}
      
      {/* ===== CHAT BUBBLE BUTTON ===== */}
      <button
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatBubble;
