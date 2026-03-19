/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { User } from '@modules/users/entities/user.entity';

@ApiTags('Habits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all habits with today completion status' })
  findAll(@CurrentUser() user: User) {
    return this.habitsService.findAll(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get habit statistics' })
  getStats(@CurrentUser() user: User) {
    return this.habitsService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single habit' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a habit' })
  create(@CurrentUser() user: User, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.id, dto);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in a habit (awards XP + updates streak)' })
  checkIn(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { note?: string },
  ) {
    return this.habitsService.checkIn(id, user.id, body.note);
  }

  @Delete(':id/check-in/today')
  @ApiOperation({ summary: 'Undo today check-in' })
  undoCheckIn(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.habitsService.undoCheckIn(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) a habit' })
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitsService.delete(id, user.id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get habit check-in logs' })
  getLogs(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.habitsService.getLogs(id, user.id);
  }
}
