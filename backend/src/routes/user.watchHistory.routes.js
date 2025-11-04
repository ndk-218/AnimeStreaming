// @ts-nocheck
const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/user.watchHistory.controller');
const { userAuth } = require('../middleware/userAuth');

/**
 * ===== USER WATCH HISTORY ROUTES =====
 * All routes require authentication
 */

// Update watch progress
router.post('/update', userAuth, watchHistoryController.updateWatchProgress);

// Get complete watch history
router.get('/', userAuth, watchHistoryController.getWatchHistory);

// Get resume info for specific series
router.get('/resume/:seriesId', userAuth, watchHistoryController.getResumeInfo);

module.exports = router;
