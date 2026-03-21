import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { InsightsService } from './insights.service';
import { User } from '@modules/users/entities/user.entity';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('dashboard')
  @ApiQuery({ name: 'timezone', required: false, example: 'Asia/Kolkata' })
  getDashboard(
    @CurrentUser() user: User,
    @Query('timezone') timezone?: string,
  ) {
    // Default to UTC if no timezone provided
    return this.insightsService.getDashboardInsights(
      user.id,
      timezone || 'UTC',
    );
  }
}
