import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { HabitLog } from './entities/habit-log.entity';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { GamificationModule } from '@modules/gamification/gamification.module';
import { LogsModule } from '@modules/logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habit, HabitLog]),
    GamificationModule,
    LogsModule,
  ],
  providers: [HabitsService],
  controllers: [HabitsController],
  exports: [HabitsService],
})
export class HabitsModule {}
