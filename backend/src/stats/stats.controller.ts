import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetStatsQueryDto } from './dto/stats.dto';

@Controller('api/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * 获取统计数据（管理员）
   */
  @Get()
  @Roles(1) // 管理员角色
  async getStats(@Query() query: GetStatsQueryDto) {
    const data = await this.statsService.getStats(query);
    return {
      success: true,
      data,
    };
  }
}
