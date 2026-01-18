import axios from 'axios';

/**
 * Gemini API Service (via Backend)
 * Handles AI chat communication through backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class GeminiService {
  /**
   * Get auth token from localStorage (authStore persisted data)
   */
  getAuthToken() {
    try {
      // authStore persists data to localStorage with key 'auth-storage'
      const authData = localStorage.getItem('auth-storage');
      
      if (!authData) {
        return null;
      }
      
      const parsed = JSON.parse(authData);
      return parsed.state?.accessToken || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Send message to AI via backend
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages (optional, not used anymore)
   * @returns {Promise<string>} - AI response
   */
  async sendMessage(userMessage, conversationHistory = []) {
    try {
      // Get token from authStore localStorage
      const token = this.getAuthToken();
      
      if (!token) {
        throw new Error('Bạn cần đăng nhập để sử dụng chatbot.');
      }
      
      // Call backend endpoint
      const response = await axios.post(
        `${API_URL}/api/chat/send`,
        {
          message: userMessage
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );
      
      // Return AI response
      if (response.data.success && response.data.data.aiResponse) {
        return response.data.data.aiResponse;
      }
      
      throw new Error('Invalid response from backend');
      
    } catch (error) {
      console.error('Gemini Service Error:', error);
      
      // Handle specific errors
      if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      if (error.response?.status === 503) {
        throw new Error(error.response.data.error || 'Server AI đang quá tải. Vui lòng thử lại sau vài phút. 🔄');
      }
      
      if (error.response?.status === 504) {
        throw new Error('Kết nối với AI timeout. Vui lòng thử lại.');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Kết nối với server timeout. Vui lòng thử lại.');
      }
      
      // Generic error
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get anime recommendations (legacy method - now uses sendMessage)
   * @param {string} userQuery - User's anime search query
   * @returns {Promise<string>} - AI response with recommendations
   */
  async getAnimeRecommendations(userQuery) {
    return await this.sendMessage(userQuery);
  }
}

// Export singleton instance
const geminiService = new GeminiService();
export default geminiService;
