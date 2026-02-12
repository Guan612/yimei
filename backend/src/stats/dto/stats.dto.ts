import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 统计查询参数
 */
const GetStatsQuerySchema = z.object({
  startDate: z.string().optional().describe('开始日期（ISO 8601格式）'),
  endDate: z.string().optional().describe('结束日期（ISO 8601格式）'),
});

export class GetStatsQueryDto extends createZodDto(GetStatsQuerySchema) {}

/**
 * 图片生成统计
 */
export interface ImageGenerationStats {
  total: number;
  byProvider: Array<{
    provider: string;
    count: number;
    cost: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
  }>;
  totalCost: number;
  successRate: number;
  trend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 用户统计
 */
export interface UserStats {
  total: number;
  recentActive: number;
}

/**
 * 聊天统计
 */
export interface ChatStats {
  totalSessions: number;
  totalMessages: number;
  byContext: Array<{
    context: string;
    count: number;
  }>;
}

/**
 * 完整统计数据
 */
export interface StatsData {
  imageGeneration: ImageGenerationStats;
  user: UserStats;
  chat: ChatStats;
}
