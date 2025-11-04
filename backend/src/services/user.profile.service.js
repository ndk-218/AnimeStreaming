// @ts-nocheck
const User = require('../models/User');
const AvatarHelper = require('../helpers/avatarHelper');

/**
 * ===== USER PROFILE SERVICE =====
 * Business logic cho user profile management
 */

/**
 * Get user profile
 */
const getProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`✅ Profile retrieved: ${user.email}`);

    return {
      success: true,
      data: user
    };

  } catch (error) {
    console.error('❌ Get profile error:', error.message);
    throw error;
  }
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updates) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Allowed fields to update
    const allowedFields = ['displayName', 'gender'];
    
    // Update only allowed fields
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }

    await user.save();

    console.log(`✅ Profile updated: ${user.email}`);

    return {
      success: true,
      data: user,
      message: 'Profile updated successfully'
    };

  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    throw error;
  }
};

/**
 * Update avatar
 */
const updateAvatar = async (userId, file) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Delete old avatar if exists
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      await AvatarHelper.deleteOldAvatar(user.avatar);
    }

    // Process and save new avatar
    const avatarPath = await AvatarHelper.processAvatar(file, userId);
    user.avatar = avatarPath;
    
    await user.save();

    console.log(`✅ Avatar updated: ${user.email}`);

    return {
      success: true,
      data: {
        avatar: user.avatar
      },
      message: 'Avatar updated successfully'
    };

  } catch (error) {
    console.error('❌ Update avatar error:', error.message);
    throw error;
  }
};

/**
 * Delete avatar (revert to default)
 */
const deleteAvatar = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Delete current avatar if exists
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      await AvatarHelper.deleteOldAvatar(user.avatar);
    }

    // Revert to default
    user.avatar = '/assets/default-avatar.png';
    await user.save();

    console.log(`✅ Avatar deleted: ${user.email}`);

    return {
      success: true,
      message: 'Avatar removed successfully'
    };

  } catch (error) {
    console.error('❌ Delete avatar error:', error.message);
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar
};
