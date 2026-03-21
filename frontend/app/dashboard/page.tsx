/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { clsx } from "clsx";
import { useAppSelector } from "@/store/store";
import { useTasks, useCompleteTask, useTaskStats } from "@/hooks/useTasks";
import { useHabits, useHabitCheckIn, useHabitStats } from "@/hooks/useHabits";
import { useQuery } from "@tanstack/react-query";
import { insightsApi } from "@/services/insights.api";
import Badge from "@/components/ui/Badge";
import StatsCard from "@/components/shared/StatsCard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import CreateHabitModal from "@/components/habits/CreateHabitModal";

// ─── Mini TaskRow for dashboard ────────────────────────────────────────────
function DashboardTaskRow({ task }: { task: any }) {
  const completeTask = useCompleteTask();
  const isCompleted = task.status === "completed";
  const isOverdue =
    task.deadline && isPast(new Date(task.deadline)) && !isCompleted;
  const isDueToday = task.deadline && isToday(new Date(task.deadline));

  return (
    <div
      className={clsx(
        "flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0",
        isCompleted && "opacity-50",
      )}
    >
      <button
        onClick={() => !isCompleted && completeTask.mutateAsync(task.id)}
        disabled={isCompleted || completeTask.isPending}
        className={clsx(
          "flex-shrink-0 transition-colors",
          isCompleted
            ? "text-emerald-500"
            : "text-slate-300 hover:text-indigo-500",
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-sm font-medium truncate",
            isCompleted
              ? "line-through text-slate-400 dark:text-slate-500"
              : "text-slate-800 dark:text-slate-200",
          )}
        >
          {task.title}
        </p>
        {task.deadline && (
          <p
            className={clsx(
              "text-xs flex items-center gap-1 mt-0.5",
              isOverdue
                ? "text-red-500"
                : isDueToday
                  ? "text-amber-600"
                  : "text-slate-400",
            )}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {isOverdue
              ? "Overdue"
              : isDueToday
                ? "Due today"
                : format(new Date(task.deadline), "MMM d")}
          </p>
        )}
      </div>

      {/* Priority dot */}
      <div
        className={clsx("w-2 h-2 rounded-full flex-shrink-0", {
          "bg-slate-300": task.priority === "low",
          "bg-blue-400": task.priority === "medium",
          "bg-orange-400": task.priority === "high",
          "bg-red-500": task.priority === "urgent",
        })}
      />
    </div>
  );
}

// ─── Mini HabitRow for dashboard ───────────────────────────────────────────
function DashboardHabitRow({ habit }: { habit: any }) {
  const checkIn = useHabitCheckIn();

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <button
        onClick={() =>
          !habit.completedToday && checkIn.mutateAsync({ id: habit.id })
        }
        disabled={habit.completedToday || checkIn.isPending}
        className={clsx(
          "w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all",
          habit.completedToday
            ? "bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-300"
            : "bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:ring-2 hover:ring-indigo-200",
        )}
      >
        {habit.icon}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-sm font-medium truncate",
            habit.completedToday
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-slate-800 dark:text-slate-200",
          )}
        >
          {habit.title}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          🔥 {habit.currentStreak} day streak
        </p>
      </div>

      {habit.completedToday && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">
          ✓ Done
        </span>
      )}
    </div>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);

  // Fetch real data
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ limit: 5 });
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: taskStats } = useTaskStats();
  const { data: habitStats } = useHabitStats();
  const { data: insights } = useQuery({
    queryKey: ["insights", "dashboard"],
    queryFn: insightsApi.getDashboard,
  });

  const tasks = tasksData?.data ?? [];
  const habits = (habitsData ?? []) as any[];

  // Split habits: pending vs done today
  const pendingHabits = habits
    .filter((h: any) => !h.completedToday)
    .slice(0, 4);
  const completedHabits = habits
    .filter((h: any) => h.completedToday)
    .slice(0, 2);
  const shownHabits = [...pendingHabits, ...completedHabits].slice(0, 5);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const habitsCompletedToday = habits.filter(
    (h: any) => h.completedToday,
  ).length;
  const habitProgressPct =
    habits.length > 0
      ? Math.round((habitsCompletedToday / habits.length) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Hero greeting ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2 className="text-2xl font-bold mt-1">
              {getGreeting()}, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              {habitsCompletedToday > 0
                ? `${habitsCompletedToday} of ${habits.length} habits done today. Keep it up!`
                : habits.length > 0
                  ? "Start checking off your habits for today!"
                  : "Create your first habit to start building streaks!"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="streak" className="text-sm px-3 py-1.5">
              🔥 {user?.streak ?? 0} day streak
            </Badge>
            <Badge variant="level" className="text-sm px-3 py-1.5">
              ⭐ Level {user?.level ?? 1}
            </Badge>
            <Badge variant="xp" className="text-sm px-3 py-1.5">
              ⚡ {user?.xp?.toLocaleString() ?? 0} XP
            </Badge>
          </div>
        </div>

        {/* XP progress bar inside hero */}
        {user && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
              <span>Progress to Level {(user.level ?? 1) + 1}</span>
              <span>
                {user.xp} / {user.xpToNextLevel} XP
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(((user.xp ?? 0) / (user.xpToNextLevel)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Tasks today"
          value={taskStats?.pending ?? 0}
          subtitle={`${taskStats?.completed ?? 0} completed`}
          icon="✅"
          color="indigo"
        />
        <StatsCard
          title="Habits done"
          value={`${habitsCompletedToday}/${habits.length}`}
          subtitle={`${habitProgressPct}% complete`}
          icon="🎯"
          color="emerald"
        />
        <StatsCard
          title="Total XP"
          value={user?.totalXp?.toLocaleString() ?? "0"}
          subtitle="All time earned"
          icon="⚡"
          color="amber"
        />
        <StatsCard
          title="Peak hour"
          value={insights?.productiveHours?.peakHour ?? "—"}
          subtitle="Most productive time"
          icon="🧠"
          color="purple"
        />
      </div>

      {/* ── Main content: Tasks + Habits side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-slate-700">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Tasks
              </h3>
              {taskStats && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {taskStats.completed} done · {taskStats.pending} pending
                  {taskStats.overdue > 0 && (
                    <span className="text-red-500 ml-1">
                      · {taskStats.overdue} overdue
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task
            </button>
          </div>

          {/* Task list */}
          <div className="px-5 py-2">
            {tasksLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No tasks yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Add your first task to get started
                </p>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Create a task →
                </button>
              </div>
            ) : (
              <>
                {tasks.map((task: any) => (
                  <DashboardTaskRow key={task.id} task={task} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {tasks.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50 dark:border-slate-700">
              <Link
                href="/tasks"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View all {taskStats?.total ?? ""} tasks
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Habits panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-slate-700">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Habits
              </h3>
              {habits.length > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {habitsCompletedToday}/{habits.length} done today
                </p>
              )}
            </div>
            <button
              onClick={() => setHabitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add habit
            </button>
          </div>

          {/* Habit progress bar */}
          {habits.length > 0 && (
            <div className="px-5 pt-3">
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${habitProgressPct}%` }}
                />
              </div>
              {habitProgressPct === 100 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center mt-1.5">
                  🎉 All habits done!
                </p>
              )}
            </div>
          )}

          {/* Habit list */}
          <div className="px-5 py-2">
            {habitsLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : habits.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No habits yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Start small. One habit changes everything.
                </p>
                <button
                  onClick={() => setHabitModalOpen(true)}
                  className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create a habit →
                </button>
              </div>
            ) : (
              <>
                {shownHabits.map((habit: any) => (
                  <DashboardHabitRow key={habit.id} habit={habit} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          {habits.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50 dark:border-slate-700">
              <Link
                href="/habits"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View all {habits.length} habits
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: Quick insight + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Your streaks
          </h3>
          {habits.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No habits yet
            </p>
          ) : (
            <div className="space-y-3">
              {habits
                .sort((a: any, b: any) => b.currentStreak - a.currentStreak)
                .slice(0, 4)
                .map((habit: any) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <span className="text-lg">{habit.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {habit.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full"
                            style={{
                              width: `${Math.min((habit.currentStreak / Math.max(habit.longestStreak, 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                          🔥 {habit.currentStreak}d
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Quick overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Tasks total",
                value: taskStats?.total ?? 0,
                icon: "📋",
                color: "text-indigo-600 dark:text-indigo-400",
              },
              {
                label: "Completed",
                value: taskStats?.completed ?? 0,
                icon: "✅",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Completion rate",
                value: `${taskStats?.completionRate ?? 0}%`,
                icon: "📈",
                color: "text-amber-600 dark:text-amber-400",
              },
              {
                label: "Overdue",
                value: taskStats?.overdue ?? 0,
                icon: "⚠️",
                color: "text-red-600 dark:text-red-400",
              },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
              >
                <p className="text-2xl mb-1">{icon}</p>
                <p className={clsx("text-xl font-bold", color)}>{value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Insights tip */}
          {insights?.productiveHours?.peakHour && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                💡 You&apos;re most productive at{" "}
                <strong>{insights.productiveHours.peakHour}</strong>.
                {insights.taskStats?.mostProductiveDay && (
                  <>
                    {" "}
                    Your best day is{" "}
                    <strong>{insights.taskStats.mostProductiveDay}</strong>.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
      <CreateHabitModal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
      />
    </div>
  );
}
