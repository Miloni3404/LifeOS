"use client";

import { useAppSelector } from "@/store/store";

export default function XPBar() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return null;

  const { xp, level, xpToNextLevel } = user;
  const percentage = Math.min((xp / xpToNextLevel) * 100, 100);

  return (
    <div className="px-3 py-3 bg-slate-800/50 rounded-xl">
      {/* Level + XP text */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {level}
          </div>
          <span className="text-xs font-medium text-slate-300">
            Level {level}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}