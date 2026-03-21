/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { LogsService } from './logs.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { User } from '@modules/users/entities/user.entity';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('activity')
  getActivityFeed(@CurrentUser() user: User, @Query('limit') limit = 20) {
    return this.logsService.getActivityFeed(user.id, +limit);
  }

  @Post('mood')
  logMood(@CurrentUser() user: User, @Body() dto: CreateMoodLogDto) {
    return this.logsService.logMood(user.id, dto, {
      tasksCompletedToday: 0, // frontend passes this
      habitsCompletedToday: 0,
    });
  }

  @Get('mood')
  getMoodHistory(@CurrentUser() user: User, @Query('days') days = 30) {
    return this.logsService.getMoodHistory(user.id, +days);
  }

  @Get('mood/stats')
  getMoodStats(@CurrentUser() user: User, @Query('days') days = 30) {
    return this.logsService.getMoodStats(user.id, +days);
  }
}
