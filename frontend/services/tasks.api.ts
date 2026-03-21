import api from "./api";
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskStats } from "@/types/task.types";
import type { PaginatedResponse } from "@/types/common.types";

export interface GetTasksParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const tasksApi = {
  getAll: async (params?: GetTasksParams): Promise<PaginatedResponse<Task>> => {
    const { data } = await api.get("/tasks", { params });
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data.data ?? data;
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    const { data } = await api.post("/tasks", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    const { data } = await api.patch(`/tasks/${id}`, payload);
    return data.data ?? data;
  },

  complete: async (id: string): Promise<{ task: Task; xpAwarded: number }> => {
    const { data } = await api.patch(`/tasks/${id}/complete`);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  getStats: async (): Promise<TaskStats> => {
    const { data } = await api.get("/tasks/stats");
    return data.data ?? data;
  },
};