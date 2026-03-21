"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/store";
import { setCredentials, logout, setLoading } from "@/store/slices/authSlice";
import { authApi } from "@/services/auth.api";

const TOKEN_KEY = "lifeos_token";

// Runs once at app startup. Reads token from localStorage, validates it,
// populates Redux. Never runs again — no re-runs on tab switch.
export default function AuthInitializer() {
  const dispatch    = useAppDispatch();
  const initialized = useRef(false); // prevent double-run in React StrictMode

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      // No token — user is definitely logged out
      dispatch(setLoading(false));
      return;
    }

    // Token exists — validate it with the backend
    authApi
      .getMe()
      .then((user) => {
        dispatch(setCredentials({ user, token }));
      })
      .catch(() => {
        // Token expired or invalid — clean up and send to login
        localStorage.removeItem(TOKEN_KEY);
        dispatch(logout());
      });
  }, [dispatch]); // runs exactly once

  // Renders nothing — pure side-effect component
  return null;
}