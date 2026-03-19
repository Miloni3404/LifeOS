import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { GamificationModule } from '@modules/gamification/gamification.module';
import { LogsModule } from '@modules/logs/logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), GamificationModule, LogsModule],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
