import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import {
  appConfig,
  jwtConfig,
  databaseConfig,
  gamificationConfig,
} from './config/env.config';
import { getDatabaseConfig } from './config/database.config';

// Common
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HabitsModule } from './modules/habits/habits.module';
import { LogsModule } from './modules/logs/logs.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { InsightsModule } from './modules/insights/insights.module';

@Module({
  imports: [
    // Config — load env vars, available everywhere via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, gamificationConfig],
    }),

    // Database — TypeORM with Supabase PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Rate limiting — 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Cron jobs (for auto-reschedule)
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    TasksModule,
    HabitsModule,
    LogsModule,
    GamificationModule,
    InsightsModule,
  ],
  providers: [
    // Apply JWT guard GLOBALLY — all routes require auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply response envelope GLOBALLY
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Apply logging GLOBALLY
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Apply exception filter GLOBALLY
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
