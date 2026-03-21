"use client";

import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/store/store";
import { lightTheme, darkTheme } from "@/styles/theme";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { setDark, setLight } from "@/store/slices/themeSlice";
import AuthInitializer from "./AuthInitializer";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const isDark = useAppSelector((s) => s.theme.isDark);
  const dispatch = useAppDispatch();

  // Read saved theme on startup
  useEffect(() => {
    const saved = localStorage.getItem("lifeos_theme");
    if (saved === "dark") dispatch(setDark());
    else if (saved === "light") dispatch(setLight());
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      dispatch(setDark());
    }
  }, []); // intentionally no deps — run once

  // Sync Tailwind dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("lifeos_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false, // ← critical: prevents re-auth on tab switch
            refetchOnMount: false,
          },
        },
      }),
  );

  const [DevTools, setDevTools] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@tanstack/react-query-devtools").then((mod) => {
        const D = () => <mod.ReactQueryDevtools initialIsOpen={false} />;
        setDevTools(() => D);
      });
    }
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeWrapper>
          {/* Auth init runs once, populates Redux before any page renders */}
          <AuthInitializer />
          {children}
        </ThemeWrapper>
        {DevTools && <DevTools />}
      </QueryClientProvider>
    </Provider>
  );
}
