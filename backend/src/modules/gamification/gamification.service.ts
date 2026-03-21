import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Achievement } from './entities/achievement.entity';
import { UsersService } from '@modules/users/users.service';

export type AwardReason =
  | 'task_complete'
  | 'habit_checkin'
  | 'streak_7'
  | 'streak_30'
  | 'first_task'
  | 'first_habit';

// Achievement definitions — key maps to unlock condition
const ACHIEVEMENTS: Record<
  string,
  { title: string; description: string; icon: string; xp: number }
> = {
  first_task: {
    title: 'First Step',
    description: 'Complete your first task',
    icon: '✅',
    xp: 100,
  },
  first_habit: {
    title: 'Habit Former',
    description: 'Check in on your first habit',
    icon: '🎯',
    xp: 100,
  },
  streak_7: {
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xp: 200,
  },
  streak_30: {
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    xp: 500,
  },
  tasks_10: {
    title: 'Task Machine',
    description: 'Complete 10 tasks',
    icon: '⚡',
    xp: 150,
  },
  habits_50: {
    title: 'Habit Hero',
    description: 'Check in on habits 50 times total',
    icon: '💪',
    xp: 300,
  },
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // Main method — called after task/habit completion
  async awardXp(
    userId: string,
    reason: AwardReason,
    context?: { streak?: number; totalTasks?: number; totalHabits?: number },
  ): Promise<{
    xpAwarded: number;
    leveledUp: boolean;
    newLevel?: number;
    achievement?: Achievement;
  }> {
    const xpMap: Record<AwardReason, string> = {
      task_complete: 'gamification.xpTaskComplete',
      habit_checkin: 'gamification.xpHabitCheckin',
      streak_7: 'gamification.xpStreakBonus7',
      streak_30: 'gamification.xpStreakBonus30',
      first_task: 'gamification.xpTaskComplete',
      first_habit: 'gamification.xpHabitCheckin',
    };

    const baseXp = this.configService.get<number>(xpMap[reason]) || 50;
    const xpAwarded = baseXp;

    const { leveledUp, newLevel } = await this.usersService.addXp(
      userId,
      xpAwarded,
    );

    // Update streak
    await this.usersService.updateStreak(userId);

    // Check for achievement unlocks
    const achievement = await this.checkAndUnlockAchievement(
      userId,
      reason,
      context,
    );

    this.logger.log(`User ${userId} awarded ${xpAwarded} XP for ${reason}`);

    return { xpAwarded, leveledUp, newLevel, achievement };
  }

  private async checkAndUnlockAchievement(
    userId: string,
    reason: AwardReason,
    context?: { streak?: number; totalTasks?: number; totalHabits?: number },
  ): Promise<Achievement | undefined> {
    const checks: { key: string; condition: boolean }[] = [
      { key: 'first_task', condition: reason === 'task_complete' },
      { key: 'first_habit', condition: reason === 'habit_checkin' },
      { key: 'streak_7', condition: (context?.streak ?? 0) >= 7 },
      { key: 'streak_30', condition: (context?.streak ?? 0) >= 30 },
      { key: 'tasks_10', condition: (context?.totalTasks ?? 0) >= 10 },
      { key: 'habits_50', condition: (context?.totalHabits ?? 0) >= 50 },
    ];

    for (const check of checks) {
      if (!check.condition) continue;

      // Already unlocked?
      const existing = await this.achievementRepo.findOne({
        where: { userId, key: check.key },
      });
      if (existing) continue;

      const def = ACHIEVEMENTS[check.key];
      if (!def) continue;

      const achievement = this.achievementRepo.create({
        userId,
        key: check.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        xpReward: def.xp,
      });

      return this.achievementRepo.save(achievement);
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.achievementRepo.find({
      where: { userId },
      order: { unlockedAt: 'DESC' },
    });
  }
}
