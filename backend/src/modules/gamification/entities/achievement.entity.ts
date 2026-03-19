/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  key: string; // unique identifier: 'first_task', 'streak_7', etc.

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  icon: string; // emoji

  @Column({ default: 0 })
  xpReward: number;

  @CreateDateColumn()
  unlockedAt: Date;
}
