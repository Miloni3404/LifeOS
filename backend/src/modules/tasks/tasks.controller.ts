/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';
import { User } from '@modules/users/entities/user.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks (paginated, filterable)' })
  findAll(@CurrentUser() user: User, @Query() query: GetTasksDto) {
    return this.tasksService.findAll(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  getStats(@CurrentUser() user: User) {
    return this.tasksService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task' })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a task (awards XP)' })
  complete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.complete(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.delete(id, user.id);
  }
}
