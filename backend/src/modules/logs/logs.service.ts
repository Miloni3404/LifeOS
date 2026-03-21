import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ActivityLog, LogEventType } from './entities/activity-log.entity';
import { MoodLog } from './entities/mood-log.entity';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { subDays } from 'date-fns';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(MoodLog)
    private readonly moodLogRepo: Repository<MoodLog>,
  ) {}

  // Called internally by tasks/habits services — not directly by user
  async createActivityLog(data: {
    userId: string;
    eventType: LogEventType;
    entityId?: string;
    entityTitle?: string;
    xpEarned?: number;
    metadata?: Record<string, any>;
  }): Promise<ActivityLog> {
    const log = this.activityLogRepo.create({
      userId: data.userId,
      eventType: data.eventType,
      entityId: data.entityId,
      entityTitle: data.entityTitle,
      xpEarned: data.xpEarned ?? 0,
      metadata: data.metadata,
    });
    return this.activityLogRepo.save(log);
  }

  async getActivityFeed(userId: string, limit = 20): Promise<ActivityLog[]> {
    return this.activityLogRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async logMood(
    userId: string,
    dto: CreateMoodLogDto,
    snapshot: {
      tasksCompletedToday: number;
      habitsCompletedToday: number;
    },
  ): Promise<MoodLog> {
    const log = this.moodLogRepo.create({
      userId,
      mood: dto.mood,
      note: dto.note,
      tasksCompletedToday: snapshot.tasksCompletedToday,
      habitsCompletedToday: snapshot.habitsCompletedToday,
    });
    return this.moodLogRepo.save(log);
  }

  async getMoodHistory(userId: string, days = 30): Promise<MoodLog[]> {
    const since = subDays(new Date(), days);
    return this.moodLogRepo.find({
      where: {
        userId,
        createdAt: Between(since, new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  // Returns per-day mood average for analytics chart
  async getMoodStats(userId: string, days = 30) {
    const logs = await this.getMoodHistory(userId, days);

    const byDay: Record<string, number[]> = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(log.mood);
    }

    return Object.entries(byDay).map(([date, moods]) => ({
      date,
      avgMood: moods.reduce((a, b) => a + b, 0) / moods.length,
      count: moods.length,
    }));
  }
}
