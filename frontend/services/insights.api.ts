import api from "./api";

// Gets the user's local timezone (e.g. "Asia/Kolkata")
const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const insightsApi = {
  getDashboard: async () => {
    const timezone = getTimezone();
    const { data } = await api.get(
      `/insights/dashboard?timezone=${encodeURIComponent(timezone)}`,
    );
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
