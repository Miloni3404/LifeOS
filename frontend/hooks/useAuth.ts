"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  setCredentials,
  logout as logoutAction,
} from "@/store/slices/authSlice";
import { authApi } from "@/services/auth.api";
import type { LoginPayload, RegisterPayload } from "@/types/auth.types";

const TOKEN_KEY = "lifeos_token";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, token, isAuthenticated, isLoading } = useAppSelector(
    (s) => s.auth,
  );

  // LOGIN
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
      }
      dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      router.push("/dashboard");
    },
  });

  // REGISTER
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
      }
      dispatch(setCredentials({ user: data.user, token: data.accessToken }));
      router.push("/dashboard");
    },
  });

  // LOGOUT
  const logout = useCallback(async () => {
    await authApi.logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
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
