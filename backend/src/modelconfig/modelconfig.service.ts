import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateModelconfigDto,
  UpdateModelconfigDto,
  QueryModelconfigDto,
  ValidateConfigDto,
  CostStatsDto,
  RateLimitConfigDto,
  PresetParamsDto,
} from './dto/modelconfig.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AI_MODEL_CONFIG_CHANGED } from 'src/common/events';
import { AiProviderService } from '../ai-provider/ai-provider.service';

interface RateLimitInfo {
  configId: number;
  count: number;
  windowStart: Date;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

@Injectable()
export class ModelconfigService {
  private readonly logger = new Logger(ModelconfigService.name);
  private rateLimitMap: Map<number, RateLimitInfo> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly aiProviderService: AiProviderService,
  ) {
    // 定期清理过期的限流记录（每分钟）
    setInterval(() => this.cleanupRateLimits(), 60000);
  }

  /**
   * 创建新的Provider配置
   */
  async create(createModelconfigDto: CreateModelconfigDto) {
    try {
      const config = await this.prisma.aiModelConfig.create({
        data: createModelconfigDto as any,
      });

      this.logger.log(
        `创建了新的Provider配置：${config.name} (ID: ${config.id})`,
      );

      this.eventEmitter.emit(AI_MODEL_CONFIG_CHANGED, {
        type: 'image-gen',
        configId: config.id,
        action: 'create',
      });

      return config;
    } catch (error) {
      this.logger.error('创建配置失败', error as any);
      throw new BadRequestException('配置创建失败：' + (error as any)?.message);
    }
  }

  /**
   * 查询所有Provider配置（支持筛选和分页）
   */
  async findAll(query?: QueryModelconfigDto) {
    const { provider, type, enabled, page = 1, pageSize = 20 } = query || {};

    const where: any = {};
    if (provider) where.provider = provider;
    if (type) where.type = type;
    if (enabled !== undefined) where.enabled = enabled;

    const [configs, total] = await Promise.all([
      this.prisma.aiModelConfig.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.aiModelConfig.count({ where }),
    ]);

    return {
      list: configs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 根据ID查询单个Provider配置
   */
  async findOne(id: number) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    return config;
  }

  /**
   * 更新Provider配置
   */
  async update(id: number, updateModelconfigDto: UpdateModelconfigDto) {
    const existing = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    try {
      const updated = await this.prisma.aiModelConfig.update({
        where: { id },
        data: updateModelconfigDto as any,
      });

      this.eventEmitter.emit(AI_MODEL_CONFIG_CHANGED, {
        type: 'image-gen',
        configId: id,
        action: 'update',
      });

      this.logger.log(`更新了Provider配置：${updated.name} (ID: ${id})`);

      return updated;
    } catch (error) {
      this.logger.error(`更新配置失败 (ID: ${id})`, error as any);
      throw new BadRequestException('配置更新失败：' + (error as any)?.message);
    }
  }

  /**
   * 删除Provider配置
   */
  async remove(id: number) {
    const existing = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    await this.prisma.aiModelConfig.delete({
      where: { id },
    });

    this.eventEmitter.emit(AI_MODEL_CONFIG_CHANGED, {
      type: 'image-gen',
      configId: id,
      action: 'delet',
    });

    this.logger.log(`删除了Provider配置：${existing.name} (ID: ${id})`);
  }

  /**
   * 验证配置是否有效（测试API Key）
   */
  async validateConfig(id: number, validateDto?: ValidateConfigDto) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    try {
      const isValid = await this.aiProviderService.validateProviderById(id);

      return {
        configId: id,
        valid: isValid,
        provider: config.provider,
        name: config.name,
      };
    } catch (error) {
      this.logger.error(`配置验证出错 (ID: ${id})`, error as any);
      throw new BadRequestException('配置验证失败：' + (error as any)?.message);
    }
  }

  /**
   * 获取成本统计（按配置维度）
   */
  async getCostStats(id: number, statsDto?: CostStatsDto) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    const where: any = {
      metadata: {
        path: ['configId'],
        equals: id,
      },
      status: 'completed',
    };

    if (statsDto?.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(statsDto.startDate),
      };
    }
    if (statsDto?.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(statsDto.endDate) };
    }

    const [stats, recentGenerations] = await Promise.all([
      this.prisma.imageGeneration.aggregate({
        where,
        _sum: { cost: true },
        _count: { id: true },
        _avg: { cost: true },
      }),
      this.prisma.imageGeneration.findMany({
        where,
        select: {
          id: true,
          prompt: true,
          cost: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      configId: id,
      configName: config.name,
      provider: config.provider,
      totalCost: stats._sum.cost || 0,
      totalRequests: stats._count.id || 0,
      avgCost: stats._avg.cost || 0,
      recentGenerations,
    };
  }

  /**
   * 设置请求限流（按配置维度）
   */
  async setRateLimit(id: number, rateLimitDto: RateLimitConfigDto) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    // 将限流配置存储到config字段中
    const updatedConfig = {
      ...(config.config as any),
      rateLimit: rateLimitDto,
    };

    await this.prisma.aiModelConfig.update({
      where: { id },
      data: { config: updatedConfig },
    });

    this.logger.log(`设置了限流配置：${config.name} (ID: ${id})`);

    return {
      configId: id,
      rateLimit: rateLimitDto,
    };
  }

  /**
   * 获取限流配置
   */
  async getRateLimit(id: number) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    const rateLimit = (config.config as any)?.rateLimit || null;

    return {
      configId: id,
      rateLimit,
    };
  }

  /**
   * 检查是否超过限流
   */
  async checkRateLimit(id: number): Promise<boolean> {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return false;
    }

    const rateLimit = (config.config as any)?.rateLimit;
    if (!rateLimit) {
      return true; // 没有设置限流，放行
    }

    const now = new Date();
    let rateLimitInfo = this.rateLimitMap.get(id);

    if (!rateLimitInfo) {
      rateLimitInfo = {
        configId: id,
        count: 0,
        windowStart: now,
        requestsPerMinute: rateLimit.requestsPerMinute,
        requestsPerHour: rateLimit.requestsPerHour,
        requestsPerDay: rateLimit.requestsPerDay,
      };
      this.rateLimitMap.set(id, rateLimitInfo);
    }

    // 检查时间窗口
    const minutesPassed =
      (now.getTime() - rateLimitInfo.windowStart.getTime()) / (1000 * 60);
    const hoursPassed = minutesPassed / 60;
    const daysPassed = hoursPassed / 24;

    // 重置计数器
    if (minutesPassed >= 1) {
      rateLimitInfo.count = 0;
      rateLimitInfo.windowStart = now;
    }

    // 检查各个限流规则
    if (
      rateLimitInfo.requestsPerMinute &&
      minutesPassed < 1 &&
      rateLimitInfo.count >= rateLimitInfo.requestsPerMinute
    ) {
      return false;
    }
    if (
      rateLimitInfo.requestsPerHour &&
      hoursPassed < 1 &&
      rateLimitInfo.count >= rateLimitInfo.requestsPerHour
    ) {
      return false;
    }
    if (
      rateLimitInfo.requestsPerDay &&
      daysPassed < 1 &&
      rateLimitInfo.count >= rateLimitInfo.requestsPerDay
    ) {
      return false;
    }

    rateLimitInfo.count++;
    return true;
  }

  /**
   * 设置参数预设
   */
  async setPreset(id: number, presetDto: PresetParamsDto) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    // 将预设参数存储到config字段中
    const updatedConfig = {
      ...(config.config as any),
      presets: {
        ...((config.config as any)?.presets || {}),
        [presetDto.presetName]: presetDto.params,
      },
    };

    await this.prisma.aiModelConfig.update({
      where: { id },
      data: { config: updatedConfig },
    });

    this.logger.log(
      `设置了参数预设「${presetDto.presetName}」：${config.name} (ID: ${id})`,
    );

    return {
      configId: id,
      presetName: presetDto.presetName,
      params: presetDto.params,
    };
  }

  /**
   * 获取所有参数预设
   */
  async getPresets(id: number) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    const presets = (config.config as any)?.presets || {};

    return {
      configId: id,
      presets,
    };
  }

  /**
   * 删除参数预设
   */
  async deletePreset(id: number, presetName: string) {
    const config = await this.prisma.aiModelConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    const presets = { ...((config.config as any)?.presets || {}) };
    delete presets[presetName];

    const updatedConfig = {
      ...(config.config as any),
      presets,
    };

    await this.prisma.aiModelConfig.update({
      where: { id },
      data: { config: updatedConfig },
    });

    this.logger.log(
      `删除了参数预设「${presetName}」：${config.name} (ID: ${id})`,
    );
  }

  /**
   * 清理过期的限流记录
   */
  private cleanupRateLimits() {
    const now = new Date();
    for (const [configId, info] of this.rateLimitMap.entries()) {
      const minutesPassed =
        (now.getTime() - info.windowStart.getTime()) / (1000 * 60);
      if (minutesPassed > 1440) {
        // 超过24小时的记录清理掉
        this.rateLimitMap.delete(configId);
      }
    }
  }
}
