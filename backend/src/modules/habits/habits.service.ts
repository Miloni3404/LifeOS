/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Habit } from './entities/habit.entity';
import { HabitLog } from './entities/habit-log.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { GamificationService } from '@modules/gamification/gamification.service';
import { LogsService } from '@modules/logs/logs.service';
import { isToday, subDays, isSameDay } from 'date-fns';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(HabitLog)
    private readonly habitLogsRepo: Repository<HabitLog>,
    private readonly gamificationService: GamificationService,
    private readonly logsService: LogsService,
  ) {}

  private getTodayRange(timezone = 'UTC'): { start: Date; end: Date } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const localDate = formatter.format(now); // "2026-03-21"

    // Parse as local midnight → convert to UTC
    const start = new Date(`${localDate}T00:00:00`);
    const end = new Date(`${localDate}T23:59:59.999`);

    // Adjust for timezone offset
    const offsetMs = now.getTimezoneOffset() * 60 * 1000; // server is UTC so offset=0
    // Use Intl to get the actual UTC times for local midnight
    const startUTC = new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now),
    );
    const utcStart = new Date(now);
    utcStart.setUTCHours(0, 0, 0, 0);
    const utcEnd = new Date(now);
    utcEnd.setUTCHours(23, 59, 59, 999);

    return { start: utcStart, end: utcEnd };
  }

  // Get habits with today's completion status
  async findAll(userId: string): Promise<any[]> {
    const habits = await this.habitsRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // Attach completedToday and recentCompletions to each habit
    return Promise.all(
      habits.map(async (habit) => {
        const { start: todayStart, end: todayEnd } = this.getTodayRange();
        const todayLog = await this.habitLogsRepo.findOne({
          where: {
            habitId: habit.id,
            completedAt: Between(todayStart, todayEnd),
          },
        });

        const recentLogs = await this.habitLogsRepo.find({
          where: {
            habitId: habit.id,
            completedAt: Between(thirtyDaysAgo, new Date()),
          },
          order: { completedAt: 'ASC' },
        });

        return {
          ...habit,
          completedToday: !!todayLog,
          recentCompletions: recentLogs.map((l) => l.completedAt.toISOString()),
        };
      }),
    );
  }

  async findOne(id: string, userId: string): Promise<Habit> {
    const habit = await this.habitsRepo.findOne({ where: { id } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.userId !== userId) throw new ForbiddenException('Access denied');
    return habit;
  }

  async create(userId: string, dto: CreateHabitDto): Promise<Habit> {
    const habit = this.habitsRepo.create({
      userId,
      title: dto.title,
      description: dto.description,
      icon: dto.icon ?? '🎯',
      frequency: dto.frequency,
      targetCount: dto.targetCount ?? 1,
    });

    const saved = await this.habitsRepo.save(habit);

    await this.logsService.createActivityLog({
      userId,
      eventType: 'habit_created',
      entityId: saved.id,
      entityTitle: saved.title,
    });

    return saved;
  }

  // Main check-in endpoint — the core of the habits system
  async checkIn(id: string, userId: string, note?: string) {
    const habit = await this.findOne(id, userId);

    // Prevent double check-in same day
    const { start, end } = this.getTodayRange();
    const existingLog = await this.habitLogsRepo.findOne({
      where: {
        habitId: habit.id,
        completedAt: Between(start, end),
      },
    });

    if (existingLog) {
      throw new ConflictException('Already checked in today');
    }

    // Calculate new streak
    const newStreak = this.calculateNewStreak(habit);
    habit.currentStreak = newStreak;
    habit.longestStreak = Math.max(habit.longestStreak, newStreak);
    habit.completedCount++;
    habit.lastCheckinDate = new Date();

    const savedHabit = await this.habitsRepo.save(habit);

    // Award XP — bonus for milestones
    let xpReason: 'habit_checkin' | 'streak_7' | 'streak_30' = 'habit_checkin';
    if (newStreak === 30) xpReason = 'streak_30';
    else if (newStreak === 7) xpReason = 'streak_7';

    const { xpAwarded, leveledUp, newLevel, achievement } =
      await this.gamificationService.awardXp(userId, xpReason, {
        streak: newStreak,
        totalHabits: habit.completedCount,
      });

    // Create habit log entry
    const log = this.habitLogsRepo.create({
      habitId: habit.id,
      userId,
      xpAwarded,
      note,
    });
    await this.habitLogsRepo.save(log);

    await this.logsService.createActivityLog({
      userId,
      eventType: newStreak % 7 === 0 ? 'habit_streak' : 'habit_checkin',
      entityId: habit.id,
      entityTitle: habit.title,
      xpEarned: xpAwarded,
      metadata: { streak: newStreak, leveledUp, newLevel },
    });

    return {
      habit: savedHabit,
      log,
      xpAwarded,
      leveledUp,
      newLevel,
      achievement,
    };
  }

  // Undo today's check-in
  async undoCheckIn(id: string, userId: string): Promise<Habit> {
    const { start: s, end: e } = this.getTodayRange();
    const habit = await this.findOne(id, userId);

    const todayLog = await this.habitLogsRepo.findOne({
      where: {
        habitId: habit.id,
        completedAt: Between(s, e),
      },
    });

    if (!todayLog) throw new NotFoundException('No check-in found for today');

    await this.habitLogsRepo.remove(todayLog);

    // Recalculate streak
    habit.completedCount = Math.max(0, habit.completedCount - 1);
    habit.currentStreak = Math.max(0, habit.currentStreak - 1);
    habit.lastCheckinDate = undefined;

    return this.habitsRepo.save(habit);
  }

  async delete(id: string, userId: string): Promise<void> {
    const habit = await this.findOne(id, userId);
    habit.isActive = false; // soft delete
    await this.habitsRepo.save(habit);
  }

  async getLogs(id: string, userId: string): Promise<HabitLog[]> {
    await this.findOne(id, userId); // verify ownership
    return this.habitLogsRepo.find({
      where: { habitId: id },
      order: { completedAt: 'DESC' },
      take: 100,
    });
  }

  async getStats(userId: string) {
    const habits = await this.habitsRepo.find({
      where: { userId, isActive: true },
    });

    if (!habits.length) {
      return {
        totalHabits: 0,
        completedToday: 0,
        averageStreak: 0,
        totalCompletions: 0,
        longestStreak: 0,
      };
    }

    const { start: todayStart } = this.getTodayRange();
    const todayLogs = await this.habitLogsRepo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.completedAt >= :start', {
        start: todayStart,
      })
      .getMany();

    const totalCompletions = habits.reduce(
      (sum, h) => sum + h.completedCount,
      0,
    );
    const longestStreak = Math.max(...habits.map((h) => h.longestStreak));
    const averageStreak =
      habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length;

    return {
      totalHabits: habits.length,
      completedToday: todayLogs.length,
      averageStreak: Math.round(averageStreak * 10) / 10,
      totalCompletions,
      longestStreak,
    };
  }

  // Calculate new streak considering last check-in date
  private calculateNewStreak(habit: Habit): number {
    if (!habit.lastCheckinDate) return 1;

    const lastDate = new Date(habit.lastCheckinDate);
    const today = new Date();

    // Already checked in today (shouldn't happen due to guard above, but defensive)
    if (isToday(lastDate)) return habit.currentStreak;

    // Yesterday — continue streak
    const yesterday = subDays(today, 1);
    if (isSameDay(lastDate, yesterday)) return habit.currentStreak + 1;

    // Missed at least 1 day — reset
    return 1;
  }
}
