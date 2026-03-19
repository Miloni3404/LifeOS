import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsService } from './insights.service';
import { Task } from '@modules/tasks/entities/task.entity';
import { HabitLog } from '@modules/habits/entities/habit-log.entity';
import { ActivityLog } from '@modules/logs/entities/activity-log.entity';
import { MoodLog } from '@modules/logs/entities/mood-log.entity';
import { InsightsController } from './insights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, HabitLog, ActivityLog, MoodLog])],
  providers: [InsightsService],
  controllers: [InsightsController],
})
export class InsightsModule {}
