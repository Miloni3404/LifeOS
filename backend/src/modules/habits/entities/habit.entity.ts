/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { HabitLog } from './habit-log.entity';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

@Entity('habits')
export class Habit {
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

  @Column({ default: '🎯' })
  icon: string;

  @Column({ type: 'varchar', default: 'daily' })
  frequency: HabitFrequency;

  @Column({ default: 1 })
  targetCount: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ default: 0 })
  completedCount: number; // total all-time check-ins

  @Column({ nullable: true, type: 'timestamp' })
  lastCheckinDate?: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => HabitLog, (log) => log.habit)
  logs: HabitLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
