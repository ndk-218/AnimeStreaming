// @ts-nocheck
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/user.profile.controller');
const { userAuth } = require('../middleware/userAuth');
const uploadAvatar = require('../middleware/uploadAvatar');

/**
 * ===== USER PROFILE ROUTES =====
 * All routes require authentication
 */

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/', userAuth, profileController.getProfile);

/**
 * PUT /api/user/profile
 * Update user profile (displayName, gender)
 */
router.put('/', userAuth, profileController.updateProfile);

/**
 * POST /api/user/profile/avatar
 * Upload/Update avatar
 */
router.post('/avatar', userAuth, uploadAvatar.single('avatar'), profileController.updateAvatar);

/**
 * DELETE /api/user/profile/avatar
 * Delete avatar (revert to default)
 */
router.delete('/avatar', userAuth, profileController.deleteAvatar);

module.exports = router;
