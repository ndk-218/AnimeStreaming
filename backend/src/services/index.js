// @ts-nocheck

/**
 * ===== SERVICES INDEX - JAVASCRIPT VERSION =====
 * Export tất cả services cho Phase 1
 */

const SeriesService = require('./series.service');
const SeasonService = require('./season.service');
const EpisodeService = require('./episode.service');

// TODO: Sẽ implement trong các bước tiếp theo
// const VideoProcessingService = require('./video-processing.service');
// const AdminService = require('./admin.service');
// const SocketService = require('./socket.service');

module.exports = {
  SeriesService,
  SeasonService,
  EpisodeService
  // VideoProcessingService, (Phase 2)
  // AdminService, (Phase 2)
  // SocketService (Phase 2)
};