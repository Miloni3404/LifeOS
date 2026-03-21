import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { MoodLog } from './entities/mood-log.entity';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog, MoodLog])],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService],
})
export class LogsModule {}
