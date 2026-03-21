import api from "./api";
import type { LoginPayload, RegisterPayload, AuthResponse, User } from "@/types/auth.types";

// Backend wraps all responses: { success: true, data: { user, accessToken } }
// We need to unwrap the .data layer
export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", payload);
    // data here is axios response.data = { success, data: AuthResponse }
    return data.data ?? data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/register", payload);
    return data.data ?? data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data.data ?? data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout").catch(() => {});
  },
};
