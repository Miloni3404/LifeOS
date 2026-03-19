/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'varchar', default: 'medium' })
  priority: TaskPriority;

  @Column({ type: 'varchar', default: 'pending' })
  status: TaskStatus;

  @Column({ nullable: true, type: 'timestamp' })
  deadline?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt?: Date;

  // Auto-reschedule tracking
  @Column({ default: 0 })
  missedCount: number;

  @Column({ nullable: true, type: 'timestamp' })
  rescheduledTo?: Date;

  // Tags stored as simple array
  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
