import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CHAT_API_URL = `${API_URL}/api/chat`; // Add /api prefix for chat routes

/**
 * Chat API Service
 * Handle communication with backend chat API
 */

class ChatService {
  
  /**
   * Get auth header with JWT token
   */
  getAuthHeader() {
    // Get token from Zustand persist store
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return {};
    
    try {
      const { state } = JSON.parse(authStorage);
      const token = state?.accessToken;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Error parsing auth storage:', error);
      return {};
    }
  }
  
  /**
   * Get user's conversation
   * @returns {Promise} - Conversation data
   */
  async getConversation() {
    try {
      const response = await axios.get(`${CHAT_API_URL}/conversation`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }
  
  /**
   * Add user message to backend
   * @param {String} message - User's message
   * @returns {Promise} - Updated conversation
   */
  async addUserMessage(message) {
    try {
      const response = await axios.post(
        `${CHAT_API_URL}/message`,
        { message },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Add user message error:', error);
      throw error;
    }
  }
  
  /**
   * Add AI response to backend
   * @param {String} response - AI's response
   * @returns {Promise} - Updated conversation
   */
  async addAIResponse(response) {
    try {
      const result = await axios.post(
        `${CHAT_API_URL}/ai-response`,
        { response },
        { headers: this.getAuthHeader() }
      );
      return result.data;
    } catch (error) {
      console.error('Add AI response error:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation history
   * @returns {Promise} - Message history
   */
  async getHistory() {
    try {
      const response = await axios.get(`${CHAT_API_URL}/history`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  }
  
  /**
   * Clear conversation (manual reset)
   * @returns {Promise} - Success status
   */
  async clearConversation() {
    try {
      const response = await axios.delete(`${CHAT_API_URL}/clear`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Clear conversation error:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation stats
   * @returns {Promise} - Stats data
   */
  async getStats() {
    try {
      const response = await axios.get(`${CHAT_API_URL}/stats`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;
