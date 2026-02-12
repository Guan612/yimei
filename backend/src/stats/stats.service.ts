import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StatsData,
  ImageGenerationStats,
  UserStats,
  ChatStats,
  GetStatsQueryDto,
} from './dto/stats.dto';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取完整统计数据
   */
  async getStats(query: GetStatsQueryDto): Promise<StatsData> {
    const { startDate, endDate } = query;

    // 构建日期过滤条件
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const [imageGeneration, user, chat] = await Promise.all([
      this.getImageGenerationStats(dateFilter),
      this.getUserStats(dateFilter),
      this.getChatStats(dateFilter),
    ]);

    return {
      imageGeneration,
      user,
      chat,
    };
  }

  /**
   * 获取图片生成统计
   */
  private async getImageGenerationStats(
    dateFilter: any,
  ): Promise<ImageGenerationStats> {
    // 总生成次数
    const total = await this.prisma.imageGeneration.count({
      where: dateFilter,
    });

    // 按Provider统计
    const byProvider = await this.prisma.imageGeneration.groupBy({
      by: ['provider'],
      where: dateFilter,
      _count: {
        id: true,
      },
      _sum: {
        cost: true,
      },
    });

    // 按状态统计
    const byStatus = await this.prisma.imageGeneration.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    // 按类型统计
    const byType = await this.prisma.imageGeneration.groupBy({
      by: ['type'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    // 总成本
    const costResult = await this.prisma.imageGeneration.aggregate({
      where: dateFilter,
      _sum: {
        cost: true,
      },
    });

    // 成功率
    const completedCount =
      byStatus.find((s) => s.status === 'completed')?._count.id || 0;
    const successRate = total > 0 ? (completedCount / total) * 100 : 0;

    // 趋势数据（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await this.prisma.imageGeneration.groupBy({
      by: ['createdAt'],
      where: {
        ...dateFilter,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 按日期聚合趋势数据
    const trendMap = new Map<string, number>();
    trendData.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + item._count.id);
    });

    const trend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      total,
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        count: p._count.id,
        cost: p._sum.cost || 0,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
      totalCost: costResult._sum.cost || 0,
      successRate: Math.round(successRate * 100) / 100,
      trend,
    };
  }

  /**
   * 获取用户统计
   */
  private async getUserStats(dateFilter: any): Promise<UserStats> {
    // 总用户数
    const total = await this.prisma.user.count();

    // 最近30天活跃用户（有图片生成记录）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActive = await this.prisma.user.count({
      where: {
        imageGenerations: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    return {
      total,
      recentActive,
    };
  }

  /**
   * 获取聊天统计
   */
  private async getChatStats(dateFilter: any): Promise<ChatStats> {
    // 总会话数
    const totalSessions = await this.prisma.chatSession.count({
      where: dateFilter,
    });

    // 总消息数
    const totalMessages = await this.prisma.chatMessage.count({
      where: dateFilter
        ? {
            session: {
              createdAt: dateFilter.createdAt,
            },
          }
        : {},
    });

    // 按上下文统计
    const byContext = await this.prisma.chatSession.groupBy({
      by: ['context'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    return {
      totalSessions,
      totalMessages,
      byContext: byContext.map((c) => ({
        context: c.context || 'general',
        count: c._count.id,
      })),
    };
  }

  /**
   * 构建日期过滤条件
   */
  private buildDateFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) {
      return {};
    }

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.lte = new Date(endDate);
      }
    }

    return filter;
  }
}
