// @ts-nocheck
const profileService = require('../services/user.profile.service');

/**
 * ===== USER PROFILE CONTROLLER =====
 * Handle HTTP requests for user profile operations
 */

/**
 * GET /api/user/profile
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use req.user._id instead of req.user.userId
    const result = await profileService.getProfile(userId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [ProfileController] getProfile error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/user/profile
 * Update user profile (displayName, gender)
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use req.user._id instead of req.user.userId
    const { displayName, gender } = req.body;

    // Validation
    const updates = {};
    
    if (displayName !== undefined) {
      if (!displayName.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Display name cannot be empty'
        });
      }
      updates.displayName = displayName.trim();
    }

    if (gender !== undefined) {
      const validGenders = ['Nam', 'Nữ', 'Không xác định'];
      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid gender value'
        });
      }
      updates.gender = gender;
    }

    const result = await profileService.updateProfile(userId, updates);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [ProfileController] updateProfile error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/user/profile/avatar
 * Update user avatar
 */
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use req.user._id instead of req.user.userId
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const result = await profileService.updateAvatar(userId, file);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [ProfileController] updateAvatar error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/user/profile/avatar
 * Delete user avatar (revert to default)
 */
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id; // Fix: use req.user._id instead of req.user.userId
    const result = await profileService.deleteAvatar(userId);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [ProfileController] deleteAvatar error:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar
};
