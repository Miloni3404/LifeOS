/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

// Can't export metadata from client component — move to separate file
// export const metadata: Metadata = { title: "Sign In" };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render a neutral shell on server — avoids gradient mismatch with MUI emotion
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🚀</span>
            <span className="text-2xl font-bold text-white">LifeOS</span>
          </div>
          <p className="text-indigo-200 text-sm">
            Personal Life Management System
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              icon: "✅",
              title: "Smart Task Management",
              desc: "Auto-reschedule missed tasks. Priority + deadline system.",
            },
            {
              icon: "🎯",
              title: "Habit Streaks",
              desc: "Build daily habits. Track streaks. Don't break the chain.",
            },
            {
              icon: "🎮",
              title: "Gamification",
              desc: "Earn XP, level up, unlock achievements as you hit goals.",
            },
            {
              icon: "📊",
              title: "Personal Insights",
              desc: "Learn when you're most productive. Spot patterns.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
                {icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{title}</h3>
                <p className="text-indigo-200 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-indigo-300 text-sm italic">
          "The secret of getting ahead is getting started."
        </p>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              LifeOS
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
