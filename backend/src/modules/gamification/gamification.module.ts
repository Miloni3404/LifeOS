import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { GamificationService } from './gamification.service';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement]), UsersModule],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
