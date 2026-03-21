/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Brain,
  TrendingUp,
  Clock,
  Flame,
  Target,
  CheckSquare,
} from "lucide-react";
import { insightsApi } from "@/services/insights.api";
import { useAppSelector } from "@/store/store";
import Loader from "@/components/ui/Loader";
// import Card from "@/components/ui/Card";
import { clsx } from "clsx";

// Mood number → label + color
const moodConfig: Record<
  number,
  { label: string; color: string; emoji: string }
> = {
  1: { label: "Awful", color: "#ef4444", emoji: "😞" },
  2: { label: "Bad", color: "#f97316", emoji: "😕" },
  3: { label: "Okay", color: "#eab308", emoji: "😐" },
  4: { label: "Good", color: "#22c55e", emoji: "🙂" },
  5: { label: "Amazing", color: "#6366f1", emoji: "🤩" },
};

// Insight card with icon
function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  color = "indigo",
}: {
  icon: any;
  title: string;
  value: string;
  description: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    coral: "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
            colors[color],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {value}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for mood chart
function MoodTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const mood = Math.round(payload[0].value);
  const cfg = moodConfig[mood] ?? moodConfig[3];
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {cfg.emoji} {cfg.label}
      </p>
    </div>
  );
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        {payload[0].value} completions
      </p>
    </div>
  );
}

// Activity feed item
function ActivityItem({ event }: { event: any }) {
  const icons: Record<string, string> = {
    task_completed: "✅",
    task_created: "📝",
    task_deleted: "🗑️",
    habit_checkin: "🎯",
    habit_streak: "🔥",
    habit_created: "✨",
    level_up: "⬆️",
    achievement_unlocked: "🏆",
    mood_logged: "💭",
  };

  const icon = icons[event.eventType] ?? "📌";
  const time = format(new Date(event.createdAt), "MMM d, h:mm a");

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
          {event.entityTitle && (
            <span className="font-medium">{event.entityTitle}</span>
          )}
          {event.xpEarned > 0 && (
            <span className="ml-2 text-xs text-amber-600 font-medium">
              +{event.xpEarned} XP
            </span>
          )}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {time}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30>(30);
  const isDark = useAppSelector((s) => s.theme.isDark);
  // const user = useAppSelector((s) => s.auth.user);

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["insights", "dashboard"],
    queryFn: insightsApi.getDashboard,
  });

  const { data: moodStats, isLoading: moodLoading } = useQuery({
    queryKey: ["mood-stats", period],
    queryFn: () => insightsApi.getMoodStats(period),
  });

  const { data: activityFeed, isLoading: feedLoading } = useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => insightsApi.getActivityFeed(15),
  });

  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const textColor = isDark ? "#94a3b8" : "#64748b";
  const chartColor = "#6366f1";

  if (insightsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader text="Loading your insights..." />
      </div>
    );
  }

  // Format mood data for chart
  const moodData = (moodStats ?? []).map((d: any) => ({
    date: format(parseISO(d.date), "MMM d"),
    mood: parseFloat(d.avgMood?.toFixed(1) ?? "0"),
    count: d.count,
  }));

  // Format task completions per day for bar chart
  const taskData = (insights?.taskStats?.dailyCompletions ?? []).map(
    (d: any) => ({
      date: format(parseISO(d.date), "MMM d"),
      count: d.count,
    }),
  );

  // Productivity by hour
  const hourData = (insights?.productiveHours?.distribution ?? [])
    .filter((d: any) => d.count > 0)
    .slice(0, 12);

  const moodTrend = insights?.moodStats?.trend ?? "no_data";
  const trendLabels: Record<string, { text: string; color: string }> = {
    improving: { text: "↑ Improving", color: "text-emerald-600" },
    declining: { text: "↓ Declining", color: "text-red-500" },
    stable: { text: "→ Stable", color: "text-amber-600" },
    no_data: { text: "No data yet", color: "text-slate-400" },
  };
  const trendInfo = trendLabels[moodTrend] ?? trendLabels.no_data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your patterns, habits, and progress at a glance
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                period === p
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              {p} days
            </button>
          ))}
        </div>
      </div>

      {/* AI-style insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <InsightCard
          icon={Clock}
          title="Peak productive hour"
          value={insights?.productiveHours?.peakHour ?? "—"}
          description="When you complete the most tasks"
          color="indigo"
        />
        <InsightCard
          icon={TrendingUp}
          title="Task completion rate"
          value={`${insights?.taskStats?.completionRate ?? 0}%`}
          description={`${insights?.taskStats?.totalCompleted ?? 0} of ${insights?.taskStats?.totalCreated ?? 0} tasks done`}
          color="emerald"
        />
        <InsightCard
          icon={Brain}
          title="Mood trend"
          value={
            insights?.moodStats?.averageMood
              ? `${insights.moodStats.averageMood}/5`
              : "—"
          }
          description={trendInfo.text}
          color="purple"
        />
        <InsightCard
          icon={Flame}
          title="Most productive day"
          value={insights?.taskStats?.mostProductiveDay ?? "—"}
          description="Day of the week with most completions"
          color="amber"
        />
        <InsightCard
          icon={Target}
          title="Habit check-ins"
          value={String(insights?.habitStats?.totalCheckIns ?? 0)}
          description={`~${insights?.habitStats?.averagePerWeek ?? 0} per week`}
          color="coral"
        />
        
        <InsightCard
          icon={CheckSquare}
          title="Total tasks"
          value={String(insights?.taskStats?.totalCreated ?? 0)}
          description={`${insights?.taskStats?.pending ?? 0} still pending`}
          color="indigo"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Mood over time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Mood over time
              </h3>
              <p
                className={clsx("text-xs mt-0.5 font-medium", trendInfo.color)}
              >
                {trendInfo.text}
              </p>
            </div>
            <div className="flex gap-2 text-xs text-slate-400">
              {[1, 3, 5].map((m) => (
                <span key={m} className="flex items-center gap-1">
                  <span>{moodConfig[m]?.emoji}</span>
                  <span>{moodConfig[m]?.label}</span>
                </span>
              ))}
            </div>
          </div>

          {moodLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader size="sm" />
            </div>
          ) : moodData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <p className="text-3xl mb-2">💭</p>
              <p className="text-sm">No mood logs yet</p>
              <p className="text-xs mt-1">Log your mood daily to see trends</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={moodData}
                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: textColor }}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: textColor }}
                />
                <Tooltip content={<MoodTooltip />} />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  dot={{ fill: chartColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task completions per day */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">
            Task completions per day
          </h3>

          {taskData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm">No completed tasks yet</p>
              <p className="text-xs mt-1">Complete tasks to see your output</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={taskData}
                margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: textColor }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: textColor }}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {taskData.map((_: any, i: number) => (
                    <Cell key={i} fill={chartColor} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Productive hours */}
      {hourData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">
            Your productive hours
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={hourData}
              margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: textColor }} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: textColor }}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {hourData.map((d: any, i: number) => (
                  <Cell
                    key={i}
                    fill={
                      d.hour === insights?.productiveHours?.peakHourNum
                        ? "#f59e0b"
                        : chartColor
                    }
                    fillOpacity={
                      d.hour === insights?.productiveHours?.peakHourNum
                        ? 1
                        : 0.6
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center font-medium">
            🌟 Gold bar = your peak hour
          </p>
        </div>
      )}

      {/* Bottom row — activity feed + mood logger */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recent activity
          </h3>
          {feedLoading ? (
            <div className="py-8 flex justify-center">
              <Loader size="sm" />
            </div>
          ) : !activityFeed?.length ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {activityFeed.map((event: any) => (
                <ActivityItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Quick mood log */}
        <MoodLogger />
      </div>
    </div>
  );
}

// Mood logger component — lets user log mood right from analytics
function MoodLogger() {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      const api = (await import("@/services/api")).default;
      await api.post("/logs/mood", { mood: selected, note });

      await queryClient.invalidateQueries({ queryKey: ["insights"] });
      await queryClient.invalidateQueries({ queryKey: ["mood-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["activity-feed"] });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelected(null);
        setNote("");
      }, 3000);
    } catch {
      // silent fail
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
        How are you feeling?
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
        Log your mood to track patterns over time
      </p>

      {submitted ? (
        <div className="py-8 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-medium text-emerald-600">Mood logged!</p>
          <p className="text-sm text-slate-400 mt-1">
            Keep logging daily for insights
          </p>
        </div>
      ) : (
        <>
          {/* Mood buttons */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            {([1, 2, 3, 4, 5] as const).map((m) => {
              const cfg = moodConfig[m];
              return (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all",
                    selected === m
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 scale-105"
                      : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600",
                  )}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note about your day..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Log mood
          </button>
        </>
      )}
    </div>
  );
}
