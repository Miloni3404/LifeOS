import api from "./api";
import type { Habit, CreateHabitPayload, HabitLog, HabitStats } from "@/types/habit.types";

export const habitsApi = {
  getAll: async (): Promise<Habit[]> => {
    const { data } = await api.get("/habits");
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Habit> => {
    const { data } = await api.get(`/habits/${id}`);
    return data.data ?? data;
  },

  create: async (payload: CreateHabitPayload): Promise<Habit> => {
    const { data } = await api.post("/habits", payload);
    return data.data ?? data;
  },

  checkIn: async (id: string, note?: string): Promise<{ habit: Habit; log: HabitLog; xpAwarded: number }> => {
    const { data } = await api.post(`/habits/${id}/check-in`, { note });
    return data.data ?? data;
  },

  undoCheckIn: async (id: string): Promise<Habit> => {
    const { data } = await api.delete(`/habits/${id}/check-in/today`);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/habits/${id}`);
  },

  getLogs: async (id: string): Promise<HabitLog[]> => {
    const { data } = await api.get(`/habits/${id}/logs`);
    return data.data ?? data;
  },

  getStats: async (): Promise<HabitStats> => {
    const { data } = await api.get("/habits/stats");
    return data.data ?? data;
  },
};