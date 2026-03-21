/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMoodLogDto {
  @ApiProperty({
    example: 4,
    description: '1=awful, 2=bad, 3=okay, 4=good, 5=great',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  mood: number;

  @ApiProperty({ required: false, example: 'Feeling productive today!' })
  @IsOptional()
  @IsString()
  note?: string;
}
