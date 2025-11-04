// ===== AVATAR PROCESSING HELPER =====
// Xử lý resize và lưu avatar bằng Sharp

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class AvatarHelper {
  
  // ===== PROCESS AVATAR =====
  static async processAvatar(file, userId) {
    try {
      // Tạo tên file unique
      const filename = `avatar_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.webp`;
      const outputPath = path.join(process.cwd(), 'uploads', 'images', 'avatars', filename);
      
      // Resize và convert về WebP
      await sharp(file.buffer)
        .resize(128, 128, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 90 })
        .toFile(outputPath);
      
      // Return relative path để lưu vào DB
      return `/uploads/images/avatars/${filename}`;
      
    } catch (error) {
      console.error('❌ [AvatarHelper] Process failed:', error.message);
      throw new Error('Lỗi xử lý ảnh đại diện');
    }
  }
  
  // ===== DELETE OLD AVATAR =====
  static async deleteOldAvatar(avatarPath) {
    try {
      // Bỏ qua nếu là default avatar
      if (!avatarPath || avatarPath.includes('default-avatar')) {
        return;
      }
      
      // Xây dựng full path
      const fullPath = path.join(process.cwd(), avatarPath);
      
      // Kiểm tra file tồn tại
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        console.log('✅ [AvatarHelper] Deleted old avatar:', avatarPath);
      } catch (err) {
        // File không tồn tại, bỏ qua
        console.log('⚠️ [AvatarHelper] Old avatar not found:', avatarPath);
      }
      
    } catch (error) {
      console.error('❌ [AvatarHelper] Delete failed:', error.message);
      // Không throw error vì không quan trọng lắm
    }
  }
}

module.exports = AvatarHelper;
