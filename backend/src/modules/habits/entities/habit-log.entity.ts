/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Habit } from './habit.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity('habit_logs')
export class HabitLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  habitId: string;

  @ManyToOne(() => Habit, (habit) => habit.logs, { onDelete: 'CASCADE' })
  habit: Habit;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ default: 0 })
  xpAwarded: number;

  @Column({ nullable: true, type: 'text' })
  note?: string;

  @CreateDateColumn()
  completedAt: Date;
}
