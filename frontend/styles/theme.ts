import { createTheme } from "@mui/material/styles";

const typography = {
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  fontSize: 15, // base font size bumped up
  h1: { fontSize: "2.2rem", fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: "1.4rem", fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: "1.2rem", fontWeight: 600 },
  body1: { fontSize: "1rem", lineHeight: 1.6 },
  body2: { fontSize: "0.9rem", lineHeight: 1.5 },
  button: {
    fontSize: "0.95rem",
    textTransform: "none" as const,
    fontWeight: 500,
  },
  caption: { fontSize: "0.8rem" },
  overline: { fontSize: "0.75rem" },
};

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none" as const,
        fontWeight: 500,
        borderRadius: 10,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderRadius: 12 },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: { fontSize: "1rem" },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6366f1", dark: "#4338ca", light: "#a5b4fc" },
    secondary: { main: "#8b5cf6" },
    background: { default: "#f8fafc", paper: "#ffffff" },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    text: { primary: "#0f172a", secondary: "#475569" },
  },
  typography,
  shape: { borderRadius: 10 },
  components,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", dark: "#6366f1", light: "#c7d2fe" },
    secondary: { main: "#a78bfa" },
    background: { default: "#0f172a", paper: "#1e293b" },
    success: { main: "#34d399" },
    warning: { main: "#fbbf24" },
    error: { main: "#f87171" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
  },
  typography,
  shape: { borderRadius: 10 },
  components: {
    ...components,
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
  },
});
