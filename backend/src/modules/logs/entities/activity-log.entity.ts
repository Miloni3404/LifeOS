/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

export type LogEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'habit_created'
  | 'habit_checkin'
  | 'habit_streak'
  | 'level_up'
  | 'achievement_unlocked'
  | 'mood_logged';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  eventType: LogEventType;

  @Column({ nullable: true })
  entityId?: string; // id of the task/habit involved

  @Column({ nullable: true })
  entityTitle?: string; // name of the task/habit

  @Column({ default: 0 })
  xpEarned: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // extra data (streak count, level, etc.)

  @CreateDateColumn()
  createdAt: Date;
}
