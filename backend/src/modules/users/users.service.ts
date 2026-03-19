/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword, comparePassword } from '@common/utils/hash.util';
import { calculateLevel } from '@common/utils/xp.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    // Check for duplicate email
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await hashPassword(data.password);

    const user = this.usersRepo.create({
      email: data.email.toLowerCase(),
      name: data.name,
      password: hashed,
    });

    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.usersRepo.save(user);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw new ConflictException('Current password is incorrect');

    user.password = await hashPassword(newPassword);
    await this.usersRepo.save(user);
  }

  // Called by GamificationService — awards XP and handles level-ups
  async addXp(
    userId: string,
    amount: number,
  ): Promise<{ user: User; leveledUp: boolean; newLevel?: number }> {
    const user = await this.findById(userId);

    user.totalXp += amount;

    const { level, xp, xpToNextLevel } = calculateLevel(user.totalXp);

    const leveledUp = level > user.level;
    const newLevel = leveledUp ? level : undefined;

    user.level = level;
    user.xp = xp;
    user.xpToNextLevel = xpToNextLevel;

    await this.usersRepo.save(user);
    return { user, leveledUp, newLevel };
  }

  // Updates streak — called when user completes any action today
  async updateStreak(userId: string): Promise<number> {
    const user = await this.findById(userId);
    const now = new Date();

    if (!user.lastActivityDate) {
      // First ever activity
      user.streak = 1;
      user.lastActivityDate = now;
    } else {
      const last = new Date(user.lastActivityDate);
      const diffMs = now.getTime() - last.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already active today — streak unchanged
      } else if (diffDays === 1) {
        // Active yesterday — continue streak
        user.streak++;
        user.lastActivityDate = now;
      } else {
        // Missed a day — reset streak
        user.streak = 1;
        user.lastActivityDate = now;
      }
    }

    await this.usersRepo.save(user);
    return user.streak;
  }

  async getProfile(userId: string): Promise<User> {
    return this.findById(userId);
  }
}
