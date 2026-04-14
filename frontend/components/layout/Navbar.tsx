"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, Sun, Moon, Search, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { toggleTheme } from "@/store/slices/themeSlice";
import Badge from "@/components/ui/Badge";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/habits": "Habits",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isDark = useAppSelector((state) => state.theme.isDark);
  const user = useAppSelector((state) => state.auth.user);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle =
    Object.entries(pageTitles).find(([route]) =>
      pathname.startsWith(route),
    )?.[1] ?? "LifeOS";

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    // Route to the appropriate page based on query
    if (q.toLowerCase().includes("habit")) {
      router.push("/habits");
    } else {
      router.push(`/tasks?search=${encodeURIComponent(q)}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 transition-colors duration-200">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar — expands inline when open */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, habits..."
              className="w-64 px-4 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {user && (
          <Badge variant="xp" className="hidden sm:flex mr-2">
            ⚡ {user.xp.toLocaleString()} XP
          </Badge>
        )}

        {/* Search toggle */}
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        {/* <button className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button> */}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold ml-1 cursor-pointer">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
