const ChatConversation = require('../models/ChatConversation');

/**
 * ===== CHAT SERVICE =====
 * Business logic cho AI Chat với anime recommendations
 */

class ChatService {
  
  /**
   * Get or create conversation for user
   * @param {String} userId - User ID
   * @returns {Object} - Conversation data
   */
  async getConversation(userId) {
    try {
      const conversation = await ChatConversation.findOrCreateForUser(userId);
      
      return {
        conversationId: conversation._id,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        expiresAt: conversation.autoDeleteAt,
        messageCount: conversation.messages.length
      };
      
    } catch (error) {
      console.error('❌ Get conversation error:', error);
      throw new Error('Failed to get conversation');
    }
  }
  
  /**
   * Add user message to conversation
   * @param {String} userId - User ID
   * @param {String} message - User's message
   * @returns {Object} - Updated conversation
   */
  async addUserMessage(userId, message) {
    try {
      // Validate message
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }
      
      if (message.length > 1000) {
        throw new Error('Message too long (max 1000 characters)');
      }
      
      // Get or create conversation
      const conversation = await ChatConversation.findOrCreateForUser(userId);
      
      // Add user message
      await conversation.addMessage('user', message.trim());
      
      return {
        conversationId: conversation._id,
        messages: conversation.messages,
        messageCount: conversation.messages.length
      };
      
    } catch (error) {
      console.error('❌ Add user message error:', error);
      throw error;
    }
  }
  
  /**
   * Add AI response to conversation
   * @param {String} userId - User ID
   * @param {String} aiResponse - AI's response
   * @returns {Object} - Updated conversation
   */
  async addAIResponse(userId, aiResponse) {
    try {
      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('AI response cannot be empty');
      }
      
      // Get conversation
      const conversation = await ChatConversation.findOrCreateForUser(userId);
      
      // Add AI message
      await conversation.addMessage('ai', aiResponse.trim());
      
      return {
        conversationId: conversation._id,
        messages: conversation.messages,
        messageCount: conversation.messages.length
      };
      
    } catch (error) {
      console.error('❌ Add AI response error:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation history for AI context
   * @param {String} userId - User ID
   * @returns {Array} - Messages formatted for AI
   */
  async getConversationHistory(userId) {
    try {
      const conversation = await ChatConversation.findOrCreateForUser(userId);
      return conversation.getMessagesForAI();
      
    } catch (error) {
      console.error('❌ Get conversation history error:', error);
      throw new Error('Failed to get conversation history');
    }
  }
  
  /**
   * Clear user's conversation
   * @param {String} userId - User ID
   * @returns {Object} - Success status
   */
  async clearConversation(userId) {
    try {
      const conversation = await ChatConversation.findOrCreateForUser(userId);
      await conversation.clearMessages();
      
      return {
        success: true,
        message: 'Conversation cleared successfully',
        conversationId: conversation._id
      };
      
    } catch (error) {
      console.error('❌ Clear conversation error:', error);
      throw new Error('Failed to clear conversation');
    }
  }
  
  /**
   * Delete user's conversation completely
   * @param {String} userId - User ID
   * @returns {Object} - Success status
   */
  async deleteConversation(userId) {
    try {
      await ChatConversation.deleteOne({ userId });
      
      return {
        success: true,
        message: 'Conversation deleted successfully'
      };
      
    } catch (error) {
      console.error('❌ Delete conversation error:', error);
      throw new Error('Failed to delete conversation');
    }
  }
  
  /**
   * Get conversation stats
   * @param {String} userId - User ID
   * @returns {Object} - Stats
   */
  async getConversationStats(userId) {
    try {
      const conversation = await ChatConversation.findOne({
        userId,
        autoDeleteAt: { $gt: new Date() }
      });
      
      if (!conversation) {
        return {
          exists: false,
          messageCount: 0
        };
      }
      
      const userMessages = conversation.messages.filter(m => m.role === 'user').length;
      const aiMessages = conversation.messages.filter(m => m.role === 'ai').length;
      
      return {
        exists: true,
        totalMessages: conversation.messages.length,
        userMessages,
        aiMessages,
        createdAt: conversation.createdAt,
        expiresAt: conversation.autoDeleteAt,
        daysRemaining: Math.ceil(
          (conversation.autoDeleteAt - new Date()) / (1000 * 60 * 60 * 24)
        )
      };
      
    } catch (error) {
      console.error('❌ Get conversation stats error:', error);
      throw new Error('Failed to get conversation stats');
    }
  }
}

// Export singleton instance
module.exports = new ChatService();
