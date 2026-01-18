// @ts-nocheck
const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');
const SeasonService = require('./season.service'); // ADD: Import SeasonService
const path = require('path');
const fs = require('fs-extra');

/**
 * ===== EPISODE SERVICE - JAVASCRIPT VERSION =====
 * Tập trung Phase 1: Admin upload, Anonymous streaming
 */
class EpisodeService {
  
  /**
   * Tạo episode mới và chuẩn bị xử lý video
   */
  static async createEpisode(data) {
    try {
      // Validate dữ liệu đầu vào
      if (!data.seriesId || !data.seasonId || !data.episodeNumber || !data.title) {
        throw new Error('Missing required fields: seriesId, seasonId, episodeNumber, title');
      }

      // Kiểm tra season tồn tại
      const season = await Season.findById(data.seasonId);
      if (!season) {
        throw new Error('Season not found');
      }

      // Kiểm tra series tồn tại
      const series = await Series.findById(data.seriesId);
      if (!series) {
        throw new Error('Series not found');
      }

      // Kiểm tra episode number đã tồn tại chưa
      const existingEpisode = await Episode.findOne({
        seasonId: data.seasonId,
        episodeNumber: data.episodeNumber
      });

      if (existingEpisode) {
        throw new Error(`Episode ${data.episodeNumber} already exists in this season`);
      }

      // Tạo episode mới
      const episode = await Episode.create({
        seriesId: data.seriesId,
        seasonId: data.seasonId,
        episodeNumber: data.episodeNumber,
        title: data.title,
        description: data.description || '',
        originalFile: data.originalFile, // Temp file path
        processingStatus: 'pending'
      });

      console.log(`✅ Episode created: ${episode.title} (ID: ${episode._id})`);
      
      // Move file from temp to organized uploads folder
      await this.organizeVideoFile(episode._id, data.originalFile);

      // FIX: Auto-update season episode count
      await SeasonService.updateEpisodeCount(data.seasonId);
      console.log(`📊 Updated episode count for season: ${data.seasonId}`);

      return episode;

    } catch (error) {
      console.error('❌ Error creating episode:', error.message);
      throw error;
    }
  }

  /**
   * Organize video file: Move from temp to uploads/{episodeId}/
   */
  static async organizeVideoFile(episodeId, tempFilePath) {
    try {
      console.log(`📦 Organizing video file for episode: ${episodeId}`);
      console.log(`   Temp file path: ${tempFilePath}`);
      
      // CRITICAL: Wait and verify file upload is complete
      let fileExists = false;
      let attempts = 0;
      const maxAttempts = 600; // 10 minutes max wait (600 seconds)
      
      while (!fileExists && attempts < maxAttempts) {
        try {
          fileExists = await fs.pathExists(tempFilePath);
          if (fileExists) {
            // Extra verification: check if file is still being written
            const stats = await fs.stat(tempFilePath);
            const initialSize = stats.size;
            
            // Wait 3 seconds and check if size changed (still uploading)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const newStats = await fs.stat(tempFilePath);
            if (newStats.size !== initialSize) {
              console.log(`   ⏳ File still uploading... Size: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
              fileExists = false; // Continue waiting
              attempts++;
              continue;
            }
            
            console.log(`   ✅ Upload complete! File size: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);
            break;
          }
        } catch (err) {
          fileExists = false;
        }
        
        if (!fileExists) {
          attempts++;
          if (attempts % 10 === 0) { // Log every 10 seconds
            console.log(`   ⏳ Waiting for upload to complete... (${attempts}/${maxAttempts} seconds)`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      if (!fileExists) {
        throw new Error(`Temp file not found after ${maxAttempts} seconds: ${tempFilePath}. Upload may have failed.`);
      }
      
      // Check final file size
      const stats = await fs.stat(tempFilePath);
      console.log(`   Final file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (stats.size === 0) {
        throw new Error('Uploaded file is empty (0 bytes)');
      }
      
      // Create organized directory structure
      const episodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId.toString());
      await fs.ensureDir(episodeDir);

      // Get original filename and extension
      const originalFilename = path.basename(tempFilePath);
      const ext = path.extname(originalFilename);
      const newFilename = `original${ext}`;
      const newFilePath = path.join(episodeDir, newFilename);
      
      console.log(`   Moving to: ${newFilePath}`);

      // Move file from temp to uploads
      await fs.move(tempFilePath, newFilePath, { overwrite: true });
      console.log(`✅ Video file organized successfully`);

      // Update episode with new file path
      await Episode.findByIdAndUpdate(episodeId, {
        originalFile: newFilePath
      });

      return newFilePath;

    } catch (error) {
      console.error('❌ Error organizing video file:', error.message);
      throw error;
    }
  }

  /**
   * Organize subtitle files: Move from temp to uploads/{episodeId}/subtitles/
   * NOTE: This will REPLACE existing subtitles
   */
  static async organizeSubtitleFiles(episodeId, subtitleFiles) {
    try {
      console.log(`📝 Organizing subtitle files for episode: ${episodeId}`);
      console.log(`   Number of subtitle files: ${subtitleFiles.length}`);

      const episodeDir = path.join(process.cwd(), 'uploads', 'videos', episodeId.toString());
      const subtitlesDir = path.join(episodeDir, 'subtitles');
      
      // IMPORTANT: Remove old subtitle folder to ensure clean replacement
      if (await fs.pathExists(subtitlesDir)) {
        console.log(`   🗑️ Removing old subtitles folder...`);
        await fs.remove(subtitlesDir);
      }
      
      // Create fresh subtitles directory
      await fs.ensureDir(subtitlesDir);

      const organizedSubtitles = [];

      for (const file of subtitleFiles) {
        try {
          // Check if temp file exists
          const fileExists = await fs.pathExists(file.path);
          if (!fileExists) {
            console.warn(`⚠️ Subtitle file not found: ${file.path}`);
            continue;
          }

          // Get file extension
          const ext = path.extname(file.originalname);
          
          // For now, we only support Vietnamese subtitle, so use 'vi' as default
          const language = 'vi';
          const newFilename = `${language}${ext}`;
          const newFilePath = path.join(subtitlesDir, newFilename);
          
          console.log(`   Moving subtitle: ${file.originalname} -> ${newFilename}`);

          // Move file from temp to subtitles folder
          await fs.move(file.path, newFilePath, { overwrite: true });

          // Add to organized list (save relative path from uploads/)
          const relativePath = path.relative(
            path.join(process.cwd(), 'uploads'),
            newFilePath
          ).replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes

          organizedSubtitles.push({
            language: 'vi',
            label: 'Tiếng Việt',
            file: `uploads/${relativePath}`
          });

          console.log(`   ✅ Subtitle organized: ${relativePath}`);
        } catch (fileError) {
          console.error(`❌ Error processing subtitle file ${file.originalname}:`, fileError.message);
        }
      }

      console.log(`✅ Organized ${organizedSubtitles.length} subtitle file(s)`);
      return organizedSubtitles;

    } catch (error) {
      console.error('❌ Error organizing subtitle files:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episode với thông tin chi tiết
   */
  static async getEpisodeWithDetails(episodeId) {
    try {
      const episode = await Episode.findById(episodeId)
        .select('+originalFile') // Thêm dòng này để lấy originalFile
        .populate('seriesId', 'title slug posterImage')
        .populate('seasonId', 'title seasonNumber seasonType');
        
      return episode;
    } catch (error) {
      console.error('❌ Error getting episode details:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả episodes trong một season
   */
  static async getEpisodesBySeason(seasonId, onlyCompleted = false) {
    try {
      const query = { seasonId };
      
      if (onlyCompleted) {
        query.processingStatus = 'completed';
      }

      const episodes = await Episode.find(query)
        .select('episodeNumber title description duration thumbnail hlsPath processingStatus viewCount')
        .sort({ episodeNumber: 1 });

      return episodes;
    } catch (error) {
      console.error('❌ Error getting episodes by season:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái xử lý video
   */
  static async updateProcessingStatus(episodeId, updates) {
    try {
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      // Cập nhật các trường được phép
      const allowedFields = [
        'processingStatus', 
        'hlsPath', 
        'qualities', 
        'duration', 
        'thumbnail',
        'subtitles'
      ];

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          episode[field] = updates[field];
        }
      });

      await episode.save();
      
      console.log(`📺 Episode processing updated: ${episode.title} - Status: ${episode.processingStatus}`);
      
      // TRIGGER NOTIFICATION: Nếu episode vừa được hoàn tất xử lý
      if (updates.processingStatus === 'completed') {
        try {
          const notificationService = require('./notification.service');
          await notificationService.createEpisodeReleaseNotifications(episodeId);
          console.log('📢 Episode release notifications sent');
        } catch (notifError) {
          console.error('⚠️ Failed to send notifications:', notifError.message);
          // Don't throw - notification failure shouldn't break episode processing
        }
        
        // ADMIN NOTIFICATION: Episode completed
        try {
          const adminNotificationService = require('./adminNotification.service');
          // Find existing upload notification to get admin info
          const AdminNotification = require('../models/AdminNotification');
          const uploadNotif = await AdminNotification.findOne({
            episodeId: episodeId,
            type: 'upload'
          }).sort({ createdAt: -1 });
          
          if (uploadNotif) {
            await adminNotificationService.createActivityNotification({
              adminId: uploadNotif.adminId,
              adminName: uploadNotif.adminName,
              action: 'updated',
              entityType: 'episode',
              entityId: episodeId,
              seriesName: uploadNotif.seriesName,
              seasonTitle: uploadNotif.seasonTitle,
              episodeTitle: uploadNotif.episodeTitle,
              episodeNumber: uploadNotif.episodeNumber
              // NOTE: No image - populated from episode.seasonId.posterImage
            });
            console.log('📢 Admin activity notification created for completed episode');
          }
        } catch (adminNotifError) {
          console.error('⚠️ Failed to create admin notification:', adminNotifError.message);
        }
      }
      
      return episode;

    } catch (error) {
      console.error('❌ Error updating processing status:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episode tiếp theo trong season
   */
  static async getNextEpisode(currentEpisodeId) {
    try {
      const currentEpisode = await Episode.findById(currentEpisodeId);
      if (!currentEpisode) return null;

      const nextEpisode = await Episode.findOne({
        seasonId: currentEpisode.seasonId,
        episodeNumber: { $gt: currentEpisode.episodeNumber },
        processingStatus: 'completed'
      })
      .select('episodeNumber title')
      .sort({ episodeNumber: 1 });

      return nextEpisode;
    } catch (error) {
      console.error('❌ Error getting next episode:', error.message);
      return null;
    }
  }

  /**
   * Lấy episode trước đó trong season
   */
  static async getPreviousEpisode(currentEpisodeId) {
    try {
      const currentEpisode = await Episode.findById(currentEpisodeId);
      if (!currentEpisode) return null;

      const previousEpisode = await Episode.findOne({
        seasonId: currentEpisode.seasonId,
        episodeNumber: { $lt: currentEpisode.episodeNumber },
        processingStatus: 'completed'
      })
      .select('episodeNumber title')
      .sort({ episodeNumber: -1 });

      return previousEpisode;
    } catch (error) {
      console.error('❌ Error getting previous episode:', error.message);
      return null;
    }
  }

  /**
   * Tăng view count cho episode + cascade update Season & Genres
   */
  static async incrementViewCount(episodeId) {
    try {
      // 1. Tăng view cho episode
      const episode = await Episode.findByIdAndUpdate(
        episodeId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );

      if (!episode) {
        throw new Error('Episode not found');
      }

      // 2. Tăng view cho Season (parent)
      const season = await Season.findByIdAndUpdate(
        episode.seasonId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );

      // 3. Tăng view cho tất cả Genres của Season
      if (season && season.genres && season.genres.length > 0) {
        const Genre = require('../models/Genre');
        await Genre.updateMany(
          { _id: { $in: season.genres } },
          { $inc: { viewCount: 1 } }
        );
        console.log(`📊 Updated viewCount for ${season.genres.length} genres`);
      }

      console.log(`👁️ View incremented: Episode ${episode.episodeNumber} (${episode.viewCount} views)`);
      return episode;
    } catch (error) {
      console.error('❌ Error incrementing view count:', error.message);
      throw error;
    }
  }

  /**
   * Thêm subtitle cho episode
   */
  static async addSubtitle(episodeId, subtitleData) {
    try {
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      // Kiểm tra subtitle đã tồn tại chưa
      const existingSubtitle = episode.subtitles.find(
        sub => sub.language === subtitleData.language && sub.type === subtitleData.type
      );

      if (existingSubtitle) {
        // Cập nhật subtitle hiện có
        existingSubtitle.label = subtitleData.label;
        existingSubtitle.file = subtitleData.file;
      } else {
        // Thêm subtitle mới
        episode.subtitles.push(subtitleData);
      }

      await episode.save();
      console.log(`📝 Subtitle added: ${subtitleData.language} for episode ${episode.title}`);
      
      return episode;
    } catch (error) {
      console.error('❌ Error adding subtitle:', error.message);
      throw error;
    }
  }

  /**
   * Xóa episode (chỉ admin)
   */
  static async deleteEpisode(episodeId) {
    try {
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        return false;
      }

      // Xóa files video nếu có
      if (episode.hlsPath) {
        const videoDir = path.dirname(episode.hlsPath);
        try {
          await fs.remove(videoDir);
          console.log(`🗑️ Removed video files: ${videoDir}`);
        } catch (fileError) {
          console.error('⚠️ Could not remove video files:', fileError.message);
        }
      }

      // Lưu seasonId trước khi xóa episode
      const seasonId = episode.seasonId;

      // Xóa episode khỏi database
      await Episode.findByIdAndDelete(episodeId);
      
      // FIX: Auto-update season episode count sau khi xóa
      await SeasonService.updateEpisodeCount(seasonId);
      console.log(`📊 Updated episode count for season: ${seasonId}`);
      
      console.log(`✅ Episode deleted: ${episode.title}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error deleting episode:', error.message);
      throw error;
    }
  }

  /**
   * Tìm kiếm episodes theo title
   */
  static async searchEpisodes(searchTerm, limit = 20) {
    try {
      const episodes = await Episode.find({
        title: { $regex: searchTerm, $options: 'i' },
        processingStatus: 'completed'
      })
      .populate('seriesId', 'title slug posterImage')
      .populate('seasonId', 'title seasonNumber')
      .select('episodeNumber title description thumbnail viewCount')
      .sort({ viewCount: -1 })
      .limit(limit);

      return episodes;
    } catch (error) {
      console.error('❌ Error searching episodes:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episodes phổ biến nhất
   */
  static async getPopularEpisodes(limit = 10) {
    try {
      const episodes = await Episode.find({
        processingStatus: 'completed'
      })
      .populate('seriesId', 'title slug posterImage genres')
      .populate('seasonId', 'title seasonNumber')
      .select('episodeNumber title description thumbnail viewCount')
      .sort({ viewCount: -1 })
      .limit(limit);

      return episodes;
    } catch (error) {
      console.error('❌ Error getting popular episodes:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episodes gần đây
   */
  static async getRecentEpisodes(limit = 12) {
    try {
      const episodes = await Episode.find({
        processingStatus: 'completed'
      })
      .populate('seriesId', 'title slug posterImage')
      .populate('seasonId', 'title seasonNumber seasonType posterImage')
      .select('episodeNumber title description thumbnail viewCount duration')
      .sort({ createdAt: -1 })
      .limit(limit);

      console.log(`📺 getRecentEpisodes: Found ${episodes.length} episodes`);
      return episodes;

    } catch (error) {
      console.error('❌ Error getting recent episodes:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episodes trending (10 ngày gần nhất + nhiều views)
   */
  static async getTrendingEpisodes(limit = 12) {
    try {
      // Calculate date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const episodes = await Episode.find({
        processingStatus: 'completed',
        createdAt: { $gte: tenDaysAgo } // Uploaded within last 10 days
      })
      .populate('seriesId', 'title slug posterImage')
      .populate('seasonId', 'title seasonNumber seasonType posterImage')
      .select('episodeNumber title description thumbnail viewCount duration createdAt')
      .sort({ viewCount: -1, createdAt: -1 }) // Sort by views DESC, then by date
      .limit(limit);

      console.log(`🔥 getTrendingEpisodes: Found ${episodes.length} trending episodes`);
      return episodes;

    } catch (error) {
      console.error('❌ Error getting trending episodes:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra episode có thể phát được không
   */
  static isEpisodePlayable(episode) {
    return episode.processingStatus === 'completed' && 
           episode.hlsPath && 
           episode.qualities && 
           episode.qualities.length > 0;
  }

  /**
   * Lấy thống kê episodes
   */
  static async getEpisodeStats() {
    try {
      const stats = await Episode.aggregate([
        {
          $group: {
            _id: '$processingStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalEpisodes = await Episode.countDocuments();
      const totalViews = await Episode.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
      ]);

      return {
        total: totalEpisodes,
        byStatus: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalViews: totalViews[0]?.totalViews || 0
      };

    } catch (error) {
      console.error('❌ Error getting episode stats:', error.message);
      throw error;
    }
  }

  /**
   * Replace video file cho episode đã tồn tại
   */
  static async replaceEpisodeVideo(episodeId, newVideoPath) {
    try {
      const episode = await Episode.findById(episodeId);
      if (!episode) {
        throw new Error('Episode not found');
      }

      const episodeDir = path.join(
        process.cwd(),
        'uploads',
        'videos',
        episodeId.toString()
      );

      // CHỈ XÓA HLS FILES, GIỮ LẠI FOLDER GỐC
      try {
        const items = await fs.readdir(episodeDir);
        
        for (const item of items) {
          const itemPath = path.join(episodeDir, item);
          const stat = await fs.stat(itemPath);
          
          // Xóa HLS folders (720p, 480p, 1080p) - KHÔNG XÓA SUBTITLES
          if (stat.isDirectory() && (item === '720p' || item === '480p' || item === '1080p')) {
            await fs.remove(itemPath);
            console.log(`🗑️ Removed HLS folder: ${item}`);
          }
          
          // Xóa master playlist
          if (stat.isFile() && item === 'master.m3u8') {
            await fs.remove(itemPath);
            console.log(`🗑️ Removed master playlist`);
          }
          
          // Xóa original video cũ
          if (stat.isFile() && item.startsWith('original.')) {
            await fs.remove(itemPath);
            console.log(`🗑️ Removed old original video`);
          }
        }
      } catch (error) {
        // Nếu folder chưa tồn tại hoặc lỗi khác, tiếp tục
        console.warn('⚠️ Cleanup warning:', error.message);
      }

      // Move video file mới vào folder (folder đã tồn tại)
      const ext = path.extname(path.basename(newVideoPath));
      const newFilename = `original${ext}`;
      const newFilePath = path.join(episodeDir, newFilename);
      
      // Ensure folder exists
      await fs.ensureDir(episodeDir);
      
      // Move new video
      await fs.move(newVideoPath, newFilePath, { overwrite: true });
      console.log(`📦 Organized video file: ${newFilePath}`);

      // Update episode with new file path
      await Episode.findByIdAndUpdate(episodeId, {
        originalFile: newFilePath,
        processingStatus: 'pending',
        hlsPath: null,
        qualities: [],
        subtitles: [],
        duration: null,
        thumbnail: null
      });

      console.log(`🔄 Episode video replaced: ${episode.title}`);
      
      return episode;

    } catch (error) {
      console.error('❌ Error replacing episode video:', error.message);
      throw error;
    }
  }
}

module.exports = EpisodeService;
