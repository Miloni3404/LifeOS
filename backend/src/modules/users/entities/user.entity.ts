/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  // Exclude ensures password is NEVER returned in API responses
  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  // Gamification fields
  @Column({ default: 0 })
  totalXp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  xp: number; // XP within current level

  @Column({ default: 1000 })
  xpToNextLevel: number;

  @Column({ default: 0 })
  streak: number;

  @Column({ nullable: true, type: 'timestamp' })
  lastActivityDate?: Date;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
