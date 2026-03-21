import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from '@modules/tasks/entities/task.entity';
import { HabitLog } from '@modules/habits/entities/habit-log.entity';
import { ActivityLog } from '@modules/logs/entities/activity-log.entity';
import { MoodLog } from '@modules/logs/entities/mood-log.entity';
import { subDays } from 'date-fns';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(HabitLog)
    private readonly habitLogsRepo: Repository<HabitLog>,
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepo: Repository<ActivityLog>,
    @InjectRepository(MoodLog)
    private readonly moodLogsRepo: Repository<MoodLog>,
  ) {}

  // ── Timezone helpers using built-in Intl API (no external packages) ────────

  // Returns hour 0-23 in the user's timezone
  private getLocalHour(date: Date, tz: string): number {
    const str = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      dateStyle: 'short',
      timeStyle: 'medium', // produces "3/21/2026, 5:46:00 PM"
    }).format(date);

    // Extract time part after the comma
    const timePart = str.split(', ').pop() ?? ''; // "5:46:00 PM"
    const segments = timePart.split(' ');
    const ampm = segments[segments.length - 1]; // "AM" or "PM"
    let hour = parseInt(segments[0].split(':')[0], 10);

    if (ampm === 'PM' && hour !== 12) hour += 12;
    else if (ampm === 'AM' && hour === 12) hour = 0;

    return isNaN(hour) ? 0 : hour;
  }

  // Returns 0=Sun … 6=Sat in user's timezone
  private getLocalDayOfWeek(date: Date, tz: string): number {
    const str = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      dateStyle: 'full', // "Saturday, March 21, 2026"
    }).format(date);

    const dayName = str.split(',')[0]; // "Saturday"
    return [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ].indexOf(dayName);
  }

  // Returns "YYYY-MM-DD" in user's timezone
  private getLocalDateString(date: Date, tz: string): string {
    // en-CA with dateStyle: 'short' produces "2026-03-21"
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      dateStyle: 'short',
    }).format(date);
  }

  // ── Main entry point ────────────────────────────────────────────────────────

  async getDashboardInsights(userId: string, timezone = 'UTC') {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [taskStats, habitStats, moodStats, productiveHours] =
      await Promise.all([
        this.getTaskInsights(userId, thirtyDaysAgo, timezone),
        this.getHabitInsights(userId, thirtyDaysAgo, timezone),
        this.getMoodInsights(userId, thirtyDaysAgo, timezone),
        this.getProductiveHours(userId, thirtyDaysAgo, timezone),
      ]);

    return {
      taskStats,
      habitStats,
      moodStats,
      productiveHours,
      timezone,
      // Show generatedAt in the user's local time so it makes sense to them
      generatedAt: new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
    };
  }

  // ── Task insights ───────────────────────────────────────────────────────────

  private async getTaskInsights(userId: string, since: Date, tz: string) {
    const tasks = await this.tasksRepo.find({
      where: { userId, createdAt: Between(since, new Date()) },
    });

    const completedTasks = tasks.filter((t) => t.status === 'completed');

    const byDayOfWeek: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    for (const task of completedTasks) {
      if (task.completedAt) {
        const dow = this.getLocalDayOfWeek(new Date(task.completedAt), tz);
        if (dow !== -1) byDayOfWeek[dow]++;
      }
    }

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const mostProductiveDay = Object.entries(byDayOfWeek).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      totalCreated: tasks.length,
      totalCompleted: completedTasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completionRate:
        tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
      mostProductiveDay: dayNames[parseInt(mostProductiveDay?.[0] ?? '1')],
      dailyCompletions: this.groupByDay(
        completedTasks.map((t) => t.completedAt as Date),
        tz,
      ),
    };
  }

  // ── Habit insights ──────────────────────────────────────────────────────────

  private async getHabitInsights(userId: string, since: Date, tz: string) {
    const logs = await this.habitLogsRepo.find({
      where: { userId, completedAt: Between(since, new Date()) },
      order: { completedAt: 'ASC' },
    });

    return {
      totalCheckIns: logs.length,
      checkInsPerDay: this.groupByDay(
        logs.map((l) => l.completedAt),
        tz,
      ),
      averagePerWeek: Math.round((logs.length / 4) * 10) / 10,
    };
  }

  // ── Mood insights ───────────────────────────────────────────────────────────

  private async getMoodInsights(userId: string, since: Date, tz: string) {
    const moods = await this.moodLogsRepo.find({
      where: { userId, createdAt: Between(since, new Date()) },
      order: { createdAt: 'ASC' },
    });

    if (!moods.length) {
      return { averageMood: 0, trend: 'no_data', data: [] };
    }

    const avgMood = moods.reduce((sum, m) => sum + m.mood, 0) / moods.length;

    const data = moods.map((m) => ({
      date: this.getLocalDateString(m.createdAt, tz),
      mood: m.mood,
      tasksCompleted: m.tasksCompletedToday,
      habitsCompleted: m.habitsCompletedToday,
    }));

    const last7 = moods.slice(-7);
    const prev7 = moods.slice(-14, -7);
    const last7Avg =
      last7.reduce((s, m) => s + m.mood, 0) / (last7.length || 1);
    const prev7Avg =
      prev7.reduce((s, m) => s + m.mood, 0) / (prev7.length || 1);
    const trend =
      last7Avg > prev7Avg
        ? 'improving'
        : last7Avg < prev7Avg
          ? 'declining'
          : 'stable';

    return {
      averageMood: Math.round(avgMood * 10) / 10,
      trend,
      data,
    };
  }

  // ── Productive hours ────────────────────────────────────────────────────────

  private async getProductiveHours(userId: string, since: Date, tz: string) {
    const logs = await this.activityLogsRepo.find({
      where: {
        userId,
        eventType: 'task_completed',
        createdAt: Between(since, new Date()),
      },
    });

    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;

    for (const log of logs) {
      const hour = this.getLocalHour(new Date(log.createdAt), tz);
      byHour[hour]++;
    }

    const peakHour = Object.entries(byHour).sort(([, a], [, b]) => b - a)[0];
    const peakHourNum = parseInt(peakHour?.[0] ?? '10');

    const formatHour = (h: number): string => {
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    };

    return {
      peakHour: formatHour(peakHourNum),
      peakHourNum,
      distribution: Object.entries(byHour).map(([hour, count]) => ({
        hour: parseInt(hour),
        label: formatHour(parseInt(hour)),
        count,
      })),
    };
  }

  // ── Shared util ─────────────────────────────────────────────────────────────

  private groupByDay(
    dates: Date[],
    tz: string,
  ): { date: string; count: number }[] {
    const byDay: Record<string, number> = {};
    for (const date of dates) {
      if (!date) continue;
      const key = this.getLocalDateString(new Date(date), tz);
      byDay[key] = (byDay[key] || 0) + 1;
    }
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
