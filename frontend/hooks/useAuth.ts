"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  setCredentials,
  logout as logoutAction,
  setLoading,
} from "@/store/slices/authSlice";
import { authApi } from "@/services/auth.api";
import type { LoginPayload, RegisterPayload } from "@/types/auth.types";

const TOKEN_KEY = "lifeos_token";

// Safe localStorage getter — returns null during SSR
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, token, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  // Re-hydrate Redux from localStorage on page refresh
  // Only runs in browser (useEffect never runs on server)
  useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const savedToken = getToken();
      if (!savedToken) {
        dispatch(setLoading(false));
        throw new Error("No token");
      }
      try {
        const user = await authApi.getMe();
        dispatch(setCredentials({ user, token: savedToken }));
        return user;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        dispatch(setLoading(false));
        throw new Error("Token invalid");
      }
    },
    enabled: !isAuthenticated && !!getToken(),
    retry: false,
    staleTime: Infinity,
  });

  // Set loading false if no token at all
  useEffect(() => {
    if (!getToken()) {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // LOGIN
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      router.push("/dashboard");
    },
  });

  // REGISTER
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => {
      console.log(payload)
      return authApi.register(payload)
    },
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      router.push("/dashboard");
    },
  });

  // LOGOUT
  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem(TOKEN_KEY);
    dispatch(logoutAction());
    queryClient.clear();
    router.push("/auth/login");
  }, [dispatch, queryClient, router]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoginLoading: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegisterLoading: registerMutation.isPending,
    logout,
  };
}
