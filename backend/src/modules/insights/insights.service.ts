/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from '@modules/tasks/entities/task.entity';
import { HabitLog } from '@modules/habits/entities/habit-log.entity';
import { ActivityLog } from '@modules/logs/entities/activity-log.entity';
import { MoodLog } from '@modules/logs/entities/mood-log.entity';
import { subDays, format, getHours, getDay } from 'date-fns';

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

  async getDashboardInsights(userId: string) {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [taskStats, habitStats, moodStats, productiveHours] =
      await Promise.all([
        this.getTaskInsights(userId, thirtyDaysAgo),
        this.getHabitInsights(userId, thirtyDaysAgo),
        this.getMoodInsights(userId, thirtyDaysAgo),
        this.getProductiveHours(userId, thirtyDaysAgo),
      ]);

    return {
      taskStats,
      habitStats,
      moodStats,
      productiveHours,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getTaskInsights(userId: string, since: Date) {
    const tasks = await this.tasksRepo.find({
      where: {
        userId,
        createdAt: Between(since, new Date()),
      },
    });

    const completedTasks = tasks.filter((t) => t.status === 'completed');

    // Group completions by day of week to find most productive day
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
        const dow = getDay(new Date(task.completedAt));
        byDayOfWeek[dow]++;
      }
    }

    const mostProductiveDay = Object.entries(byDayOfWeek).sort(
      ([, a], [, b]) => b - a,
    )[0];

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    return {
      totalCreated: tasks.length,
      totalCompleted: completedTasks.length,
      completionRate:
        tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
      mostProductiveDay: dayNames[parseInt(mostProductiveDay?.[0] ?? '1')],
      dailyCompletions: this.groupByDay(
        completedTasks.map((t) => t.completedAt as Date),
      ),
    };
  }

  private async getHabitInsights(userId: string, since: Date) {
    const logs = await this.habitLogsRepo.find({
      where: {
        userId,
        completedAt: Between(since, new Date()),
      },
      order: { completedAt: 'ASC' },
    });

    // Find which habits get skipped most often on which days
    const skipsByDayOfWeek: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    // (requires more complex logic — this is the seeds of it)

    return {
      totalCheckIns: logs.length,
      checkInsPerDay: this.groupByDay(logs.map((l) => l.completedAt)),
      averagePerWeek: Math.round((logs.length / 4) * 10) / 10,
    };
  }

  private async getMoodInsights(userId: string, since: Date) {
    const moods = await this.moodLogsRepo.find({
      where: {
        userId,
        createdAt: Between(since, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    if (!moods.length) return { averageMood: 0, trend: 'no_data', data: [] };

    const avgMood = moods.reduce((sum, m) => sum + m.mood, 0) / moods.length;

    const data = moods.map((m) => ({
      date: format(m.createdAt, 'yyyy-MM-dd'),
      mood: m.mood,
      tasksCompleted: m.tasksCompletedToday,
      habitsCompleted: m.habitsCompletedToday,
    }));

    // Simple trend: compare last 7 days vs previous 7 days
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

    return { averageMood: Math.round(avgMood * 10) / 10, trend, data };
  }

  private async getProductiveHours(userId: string, since: Date) {
    const logs = await this.activityLogsRepo.find({
      where: {
        userId,
        eventType: 'task_completed',
        createdAt: Between(since, new Date()),
      },
    });

    // Count completions by hour of day
    const byHour: Record<number, number> = {};
    for (let h = 0; h < 24; h++) byHour[h] = 0;

    for (const log of logs) {
      const hour = getHours(log.createdAt);
      byHour[hour]++;
    }

    const peakHour = Object.entries(byHour).sort(([, a], [, b]) => b - a)[0];
    const peakHourNum = parseInt(peakHour?.[0] ?? '10');

    const formatHour = (h: number) => {
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

  private groupByDay(dates: Date[]): { date: string; count: number }[] {
    const byDay: Record<string, number> = {};
    for (const date of dates) {
      if (!date) continue;
      const key = format(new Date(date), 'yyyy-MM-dd');
      byDay[key] = (byDay[key] || 0) + 1;
    }
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
