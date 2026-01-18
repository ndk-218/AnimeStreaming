const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { userAuth } = require('../middleware/userAuth');

/**
 * ===== CHAT ROUTES =====
 * All routes require user authentication
 * Base path: /api/chat
 */

// ============================================
// GET CONVERSATION & HISTORY
// ============================================

/**
 * @route   GET /api/chat/conversation
 * @desc    Get user's current conversation
 * @access  Private
 */
router.get('/conversation', userAuth, chatController.getConversation);

/**
 * @route   GET /api/chat/history
 * @desc    Get conversation history (formatted for AI)
 * @access  Private
 */
router.get('/history', userAuth, chatController.getHistory);

/**
 * @route   GET /api/chat/stats
 * @desc    Get conversation statistics
 * @access  Private
 */
router.get('/stats', userAuth, chatController.getStats);

// ============================================
// ADD MESSAGES
// ============================================

/**
 * @route   POST /api/chat/message
 * @desc    Add user message to conversation
 * @access  Private
 * @body    { message: String }
 */
router.post('/message', userAuth, chatController.addMessage);

/**
 * @route   POST /api/chat/ai-response
 * @desc    Add AI response to conversation
 * @access  Private
 * @body    { response: String }
 */
router.post('/ai-response', userAuth, chatController.addAIResponse);

// ============================================
// CLEAR & DELETE
// ============================================

/**
 * @route   DELETE /api/chat/clear
 * @desc    Clear conversation messages (manual reset)
 * @access  Private
 */
router.delete('/clear', userAuth, chatController.clearConversation);

/**
 * @route   DELETE /api/chat/delete
 * @desc    Delete conversation completely
 * @access  Private
 */
router.delete('/delete', userAuth, chatController.deleteConversation);

module.exports = router;
