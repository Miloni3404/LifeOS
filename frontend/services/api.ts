import axios from "axios";
import { store } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

// Base URL from env variable — different for dev and production
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
console.log(BASE_URL)

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR — automatically attaches JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from Redux store
    // const token = store.getState().auth.token;
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("lifeos_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  // (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR — handles auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, log the user out automatically
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // store.dispatch(logout());
      // Clear token from localStorage
      localStorage.removeItem("lifeos_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

export default api;
