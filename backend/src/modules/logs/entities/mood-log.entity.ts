/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

@Entity('mood_logs')
export class MoodLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int' })
  mood: number; // 1-5 (awful to great)

  @Column({ nullable: true })
  note?: string;

  // Snapshot of productivity at the time of logging
  @Column({ default: 0 })
  tasksCompletedToday: number;

  @Column({ default: 0 })
  habitsCompletedToday: number;

  @CreateDateColumn()
  createdAt: Date;
}
