import api from './api';

const seriesService = {
  // Get series detail with seasons and default season
  getSeriesDetail: async (slug) => {
    const response = await api.get(`/series/${slug}`);
    return response.data;
  },

  // Get episodes by season with batch pagination
  getSeasonEpisodes: async (seasonId, batch = 1, limit = 24) => {
    const response = await api.get(`/seasons/${seasonId}/episodes`, {
      params: { batch, limit }
    });
    return response.data;
  }
};

export default seriesService;
