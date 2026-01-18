const chatService = require('../services/chat.service');

/**
 * ===== CHAT CONTROLLER =====
 * HTTP handlers cho AI Chat endpoints
 */

/**
 * @route   GET /api/chat/conversation
 * @desc    Get user's current conversation
 * @access  Private (requires userAuth)
 */
const getConversation = async (req, res) => {
  try {
    const userId = req.userId;
    
    const conversation = await chatService.getConversation(userId);
    
    res.json({
      success: true,
      data: conversation
    });
    
  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation'
    });
  }
};

/**
 * @route   POST /api/chat/message
 * @desc    Add user message to conversation
 * @access  Private (requires userAuth)
 * @body    { message: String }
 */
const addMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { message } = req.body;
    
    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Add user message
    const result = await chatService.addUserMessage(userId, message);
    
    res.json({
      success: true,
      data: result,
      message: 'Message added successfully'
    });
    
  } catch (error) {
    console.error('❌ Add message error:', error);
    
    if (error.message === 'Message too long (max 1000 characters)') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add message'
    });
  }
};

/**
 * @route   POST /api/chat/ai-response
 * @desc    Add AI response to conversation
 * @access  Private (requires userAuth)
 * @body    { response: String }
 */
const addAIResponse = async (req, res) => {
  try {
    const userId = req.userId;
    const { response } = req.body;
    
    // Validate input
    if (!response) {
      return res.status(400).json({
        success: false,
        error: 'AI response is required'
      });
    }
    
    // Add AI response
    const result = await chatService.addAIResponse(userId, response);
    
    res.json({
      success: true,
      data: result,
      message: 'AI response added successfully'
    });
    
  } catch (error) {
    console.error('❌ Add AI response error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add AI response'
    });
  }
};

/**
 * @route   GET /api/chat/history
 * @desc    Get conversation history (formatted for AI)
 * @access  Private (requires userAuth)
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    const history = await chatService.getConversationHistory(userId);
    
    res.json({
      success: true,
      data: {
        messages: history,
        count: history.length
      }
    });
    
  } catch (error) {
    console.error('❌ Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation history'
    });
  }
};

/**
 * @route   DELETE /api/chat/clear
 * @desc    Clear user's conversation (manual reset)
 * @access  Private (requires userAuth)
 */
const clearConversation = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await chatService.clearConversation(userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Conversation cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear conversation'
    });
  }
};

/**
 * @route   DELETE /api/chat/delete
 * @desc    Delete user's conversation completely
 * @access  Private (requires userAuth)
 */
const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await chatService.deleteConversation(userId);
    
    res.json({
      success: true,
      data: result,
      message: 'Conversation deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete conversation'
    });
  }
};

/**
 * @route   GET /api/chat/stats
 * @desc    Get conversation statistics
 * @access  Private (requires userAuth)
 */
const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await chatService.getConversationStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation stats'
    });
  }
};

module.exports = {
  getConversation,
  addMessage,
  addAIResponse,
  getHistory,
  clearConversation,
  deleteConversation,
  getStats
};
