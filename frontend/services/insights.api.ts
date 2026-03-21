import api from "./api";

export const insightsApi = {
  getDashboard: async () => {
    const { data } = await api.get("/insights/dashboard");
    return data.data ?? data;
  },

  getMoodStats: async (days = 30) => {
    const { data } = await api.get(`/logs/mood/stats?days=${days}`);
    return data.data ?? data;
  },

  getActivityFeed: async (limit = 20) => {
    const { data } = await api.get(`/logs/activity?limit=${limit}`);
    return data.data ?? data;
  },
};