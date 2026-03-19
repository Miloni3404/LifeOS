import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const gamificationConfig = registerAs('gamification', () => ({
  xpTaskComplete: parseInt(process.env.XP_TASK_COMPLETE || '50', 10),
  xpHabitCheckin: parseInt(process.env.XP_HABIT_CHECKIN || '30', 10),
  xpStreakBonus7: parseInt(process.env.XP_STREAK_BONUS_7 || '100', 10),
  xpStreakBonus30: parseInt(process.env.XP_STREAK_BONUS_30 || '500', 10),
  xpLevelBase: parseInt(process.env.XP_LEVEL_BASE || '1000', 10),
}));
