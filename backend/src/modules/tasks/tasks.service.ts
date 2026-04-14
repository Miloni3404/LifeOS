import { GamificationService } from '@modules/gamification/gamification.service';
import { LogsService } from '@modules/logs/logs.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays } from 'date-fns';
import { Like, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly gamificationService: GamificationService,
    private readonly logsService: LogsService,
  ) {}

  async findAll(userId: string, dto: GetTasksDto) {
    const { status, priority, search, page = 1, limit = 20 } = dto;

    const where: any = { userId };

    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (search) where.title = Like(`%${search}%`);

    const [data, total] = await this.tasksRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.userId !== userId) throw new ForbiddenException('Access denied');
    return task;
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepo.create({
      userId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? 'medium',
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      tags: dto.tags ?? [],
      status: 'pending',
    });

    const saved = await this.tasksRepo.save(task);

    await this.logsService.createActivityLog({
      userId,
      eventType: 'task_created',
      entityId: saved.id,
      entityTitle: saved.title,
    });

    return saved;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, userId);
    Object.assign(task, dto);
    if (dto.deadline) task.deadline = new Date(dto.deadline);
    return this.tasksRepo.save(task);
  }

  // Dedicated complete endpoint — awards XP
  async complete(id: string, userId: string) {
    const task = await this.findOne(id, userId);

    if (task.status === 'completed') {
      return { task, xpAwarded: 0 };
    }

    task.status = 'completed';
    task.completedAt = new Date();
    const saved = await this.tasksRepo.save(task);

    // Count total completed tasks for achievement check
    const totalCompleted = await this.tasksRepo.count({
      where: { userId, status: 'completed' },
    });

    // Award XP via gamification service
    const { xpAwarded, leveledUp, newLevel, achievement } =
      await this.gamificationService.awardXp(userId, 'task_complete', {
        totalTasks: totalCompleted,
      });

    // Log the event
    await this.logsService.createActivityLog({
      userId,
      eventType: 'task_completed',
      entityId: saved.id,
      entityTitle: saved.title,
      xpEarned: xpAwarded,
      metadata: { leveledUp, newLevel },
    });

    return { task: saved, xpAwarded, leveledUp, newLevel, achievement };
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.logsService.createActivityLog({
      userId,
      eventType: 'task_deleted',
      entityId: task.id,
      entityTitle: task.title,
    });
    await this.tasksRepo.remove(task);
  }

  async getStats(userId: string) {
    const now = new Date();

    const [total, completed, pending, overdue] = await Promise.all([
      this.tasksRepo.count({ where: { userId } }),
      this.tasksRepo.count({ where: { userId, status: 'completed' } }),
      this.tasksRepo.count({ where: { userId, status: 'pending' } }),
      // Overdue = pending with deadline in the past
      this.tasksRepo
        .createQueryBuilder('task')
        .where('task.userId = :userId', { userId })
        .andWhere('task.status = :status', { status: 'pending' })
        .andWhere('task.deadline IS NOT NULL')
        .andWhere('task.deadline < :now', { now })
        .getCount(),
    ]);

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  // Called by a scheduler — auto-reschedule overdue tasks
  async rescheduleOverdueTasks(): Promise<number> {
    const now = new Date();

    const overdueTasks = await this.tasksRepo
      .createQueryBuilder('task')
      .where('task.status = :status', { status: 'pending' })
      .andWhere('task.deadline IS NOT NULL')
      .andWhere('task.deadline < :now', { now })
      .getMany();

    let count = 0;
    for (const task of overdueTasks) {
      task.rescheduledTo = addDays(now, 1); // push to tomorrow
      task.missedCount++;
      // Don't change the original deadline — track it for insights
      await this.tasksRepo.save(task);
      count++;
    }

    return count;
  }
}
