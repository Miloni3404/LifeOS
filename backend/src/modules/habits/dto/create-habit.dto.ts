/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning run' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ example: 'Run for at least 30 minutes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '🏃' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetCount?: number;
}
