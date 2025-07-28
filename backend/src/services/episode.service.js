// @ts-nocheck
const Episode = require('../models/Episode');
const Season = require('../models/Season');
const Series = require('../models/Series');
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
        originalFile: data.originalFile,
        processingStatus: 'pending'
      });

      console.log(`✅ Episode created: ${episode.title} (ID: ${episode._id})`);
      return episode;

    } catch (error) {
      console.error('❌ Error creating episode:', error.message);
      throw error;
    }
  }

  /**
   * Lấy episode với thông tin chi tiết
   */
  static async getEpisodeWithDetails(episodeId) {
    try {
      const episode = await Episode.findById(episodeId)
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
   * Tăng view count cho episode
   */
  static async incrementViewCount(episodeId) {
    try {
      const episode = await Episode.findByIdAndUpdate(
        episodeId,
        { $inc: { viewCount: 1 } },
        { new: true }
      );

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

      // Xóa episode khỏi database
      await Episode.findByIdAndDelete(episodeId);
      
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
}

module.exports = EpisodeService;