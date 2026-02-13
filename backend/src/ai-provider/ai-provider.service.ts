import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import {
  AI_MODEL_CONFIG_CHANGED,
  AiModelConfigChangedPayload,
} from '../common/events';
import {
  BaseProvider,
  TextGenProvider,
  ImageGenProvider,
  AiModelConfig,
} from './providers/base.provider';

/**
 * Provider 性能指标
 */
interface ProviderMetrics {
  configId: number;
  name: string;
  serviceType: string;
  providerType: string;

  // 健康状态
  isHealthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number; // 连续失败次数

  // 性能指标
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number; // 平均响应时间（毫秒）
  minResponseTime: number;
  maxResponseTime: number;

  // 计算得分用的临时数据
  responseTimes: number[]; // 最近的响应时间记录（保留最近50条）

  // 评分
  score?: number; // 综合评分
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  // 存储所有 provider 实例，key 为 configId
  private providerInstances: Map<number, BaseProvider> = new Map();

  // Provider 类型映射表 - 将在注册时填充
  private providerClassMap = new Map<
    string, // serviceType-providerType
    new (httpService: HttpService) => BaseProvider
  >();

  // 性能监控数据
  private metricsMap: Map<number, ProviderMetrics> = new Map();

  // 健康检查配置
  private readonly MAX_CONSECUTIVE_FAILURES = 3; // 最大连续失败次数
  private readonly RESPONSE_TIME_SAMPLE_SIZE = 50; // 保留最近的响应时间样本数

  // 评分权重配置
  private readonly WEIGHT_HEALTH = 0.4; // 健康状态权重
  private readonly WEIGHT_RESPONSE_TIME = 0.3; // 响应时间权重
  private readonly WEIGHT_SUCCESS_RATE = 0.2; // 成功率权重
  private readonly WEIGHT_PRIORITY = 0.1; // 优先级权重

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // 移除 OnModuleInit，由 AiProviderModule 手动调用 loadProviders()

  /**
   * 注册 Provider 类
   * 在模块初始化时调用，用于注册各种 provider 实现
   */
  registerProvider(
    serviceType: string,
    providerType: string,
    providerClass: new (httpService: HttpService) => BaseProvider,
  ) {
    const key = `${serviceType}-${providerType}`;
    this.providerClassMap.set(key, providerClass);
    this.logger.log(`已注册 Provider: ${key}`);
  }

  /**
   * 从数据库加载所有启用的 Provider
   */
  async loadProviders() {
    this.logger.log('正在从数据库加载 AI 服务配置...');

    const configs = await this.prisma.aiModelConfig.findMany({
      where: {
        enabled: true,
      },
      orderBy: {
        priority: 'desc', // 优先级高的排在前面
      },
    });

    this.providerInstances.clear();
    this.metricsMap.clear();

    for (const config of configs) {
      try {
        const provider = this.createProvider(config);
        if (provider) {
          this.providerInstances.set(config.id, provider);

          // 初始化性能监控指标
          this.metricsMap.set(config.id, {
            configId: config.id,
            name: config.name,
            serviceType: config.type,
            providerType: config.provider,
            isHealthy: true, // 初始假设健康
            lastHealthCheck: new Date(),
            consecutiveFailures: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            responseTimes: [],
          });

          this.logger.log(
            `已加载服务：${config.type}/${config.provider}（ID: ${config.id}，名称: ${config.name}）`,
          );
        }
      } catch (error) {
        this.logger.error(
          `加载服务失败（ID: ${config.id}，类型: ${config.type}/${config.provider}）`,
          error as any,
        );
      }
    }

    this.logger.log(`已加载 ${this.providerInstances.size} 个 AI 服务配置`);
  }

  /**
   * 根据配置创建 Provider 实例
   */
  private createProvider(config: AiModelConfig): BaseProvider | null {
    const key = `${config.type}-${config.provider}`;
    const ProviderClass = this.providerClassMap.get(key);

    if (!ProviderClass) {
      this.logger.warn(`未知的服务类型：${key}`);
      return null;
    }

    const provider = new ProviderClass(this.httpService);
    provider.setConfig(config);
    return provider;
  }

  /**
   * 根据配置 ID 获取 Provider
   */
  getProviderById<T extends BaseProvider = BaseProvider>(configId: number): T {
    const provider = this.providerInstances.get(configId);
    if (!provider) {
      throw new NotFoundException(
        `未找到配置 ID 为 ${configId} 的 AI 服务，或该服务已被禁用`,
      );
    }
    return provider as T;
  }

  /**
   * 根据 serviceType 和 providerType 获取第一个可用的 Provider
   */
  getProviderByType<T extends BaseProvider = BaseProvider>(
    serviceType: string,
    providerType?: string,
  ): T {
    for (const provider of this.providerInstances.values()) {
      if (provider.serviceType === serviceType) {
        if (!providerType || provider.providerType === providerType) {
          return provider as T;
        }
      }
    }

    const typeStr = providerType
      ? `${serviceType}/${providerType}`
      : serviceType;
    throw new NotFoundException(`当前没有可用的「${typeStr}」AI 服务`);
  }

  /**
   * 执行健康检查 - 使用 @Interval 装饰器定期执行
   */
  @Cron('* * 2 * * *') // 每 60 秒执行一次
  private async performHealthCheck() {
    // 如果没有加载任何 provider，跳过检查
    if (this.providerInstances.size === 0) {
      return;
    }

    this.logger.debug('开始执行健康检查...');

    const checkPromises = Array.from(this.providerInstances.entries()).map(
      async ([configId, provider]) => {
        const metrics = this.metricsMap.get(configId);
        if (!metrics) return;

        try {
          const startTime = Date.now();
          const isValid = await provider.validateConfig();
          const responseTime = Date.now() - startTime;

          if (isValid) {
            metrics.isHealthy = true;
            metrics.consecutiveFailures = 0;
            this.logger.debug(
              `✓ ${provider.name} 健康检查通过（${responseTime}ms）`,
            );
          } else {
            metrics.consecutiveFailures++;
            if (metrics.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
              metrics.isHealthy = false;
              this.logger.warn(
                `✗ ${provider.name} 健康检查失败，已标记为不健康`,
              );
            }
          }

          metrics.lastHealthCheck = new Date();
        } catch (error) {
          metrics.consecutiveFailures++;
          if (metrics.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            metrics.isHealthy = false;
            this.logger.warn(
              `✗ ${provider.name} 健康检查异常：${(error as any)?.message || error}`,
            );
          }
          metrics.lastHealthCheck = new Date();
        }
      },
    );

    await Promise.all(checkPromises);
    this.logger.debug('健康检查完成');
  }

  /**
   * 记录请求性能
   */
  recordRequestMetrics(
    configId: number,
    success: boolean,
    responseTime: number,
  ) {
    const metrics = this.metricsMap.get(configId);
    if (!metrics) return;

    metrics.totalRequests++;

    if (success) {
      metrics.successfulRequests++;
      metrics.consecutiveFailures = 0; // 成功后重置连续失败计数

      // 记录响应时间
      metrics.responseTimes.push(responseTime);
      if (metrics.responseTimes.length > this.RESPONSE_TIME_SAMPLE_SIZE) {
        metrics.responseTimes.shift(); // 保持数组大小
      }

      // 更新响应时间统计
      metrics.avgResponseTime =
        metrics.responseTimes.reduce((a, b) => a + b, 0) /
        metrics.responseTimes.length;
      metrics.minResponseTime = Math.min(...metrics.responseTimes);
      metrics.maxResponseTime = Math.max(...metrics.responseTimes);
    } else {
      metrics.failedRequests++;
      metrics.consecutiveFailures++;

      // 如果连续失败次数过多，标记为不健康
      if (metrics.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        metrics.isHealthy = false;
        this.logger.warn(`${metrics.name} 因连续失败过多被标记为不健康`);
      }
    }
  }

  /**
   * 包装方法：自动记录性能指标
   * 使用示例：
   * ```typescript
   * const result = await this.aiProviderService.withMetrics(
   *   provider,
   *   () => provider.someMethod(args)
   * );
   * ```
   */
  async withMetrics<T>(
    provider: BaseProvider,
    fn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      this.recordRequestMetrics(provider.configId, success, responseTime);
    }
  }

  /**
   * 计算 Provider 的综合评分
   */
  private calculateScore(
    metrics: ProviderMetrics,
    config: AiModelConfig,
  ): number {
    // 健康状态得分（0 或 100）
    const healthScore = metrics.isHealthy ? 100 : 0;

    // 响应时间得分（越快越高，最快 100 分，最慢 0 分）
    // 假设 5000ms 为最差，0ms 为最好
    const maxAcceptableTime = 5000;
    const responseTimeScore = Math.max(
      0,
      100 - (metrics.avgResponseTime / maxAcceptableTime) * 100,
    );

    // 成功率得分（0-100）
    const successRate =
      metrics.totalRequests > 0
        ? (metrics.successfulRequests / metrics.totalRequests) * 100
        : 100;

    // 优先级得分（归一化到 0-100，假设优先级范围 0-10）
    const priorityScore = (config.priority / 10) * 100;

    // 综合评分
    const totalScore =
      healthScore * this.WEIGHT_HEALTH +
      responseTimeScore * this.WEIGHT_RESPONSE_TIME +
      successRate * this.WEIGHT_SUCCESS_RATE +
      priorityScore * this.WEIGHT_PRIORITY;

    return totalScore;
  }

  /**
   * 智能选择可用的 Provider（基于健康状态、性能和优先级）
   */
  async selectProvider<T extends BaseProvider = BaseProvider>(
    serviceType: string,
  ): Promise<T> {
    const candidates: Array<{
      provider: BaseProvider;
      metrics: ProviderMetrics;
      config: AiModelConfig;
      score: number;
    }> = [];

    // 收集所有候选的 provider
    for (const [configId, provider] of this.providerInstances.entries()) {
      if (provider.serviceType !== serviceType) continue;

      const metrics = this.metricsMap.get(configId);
      if (!metrics) continue;

      // 只考虑健康的 provider
      if (!metrics.isHealthy) {
        this.logger.debug(`跳过不健康的服务：${provider.name}`);
        continue;
      }

      const config = await this.prisma.aiModelConfig.findUnique({
        where: { id: configId },
      });

      if (!config) continue;

      const score = this.calculateScore(metrics, config);
      metrics.score = score;

      candidates.push({ provider, metrics, config, score });
    }

    // 如果没有健康的 provider，尝试所有 provider（降级方案）
    if (candidates.length === 0) {
      this.logger.warn(
        `没有健康的 ${serviceType} 服务，尝试使用所有可用服务...`,
      );

      for (const [configId, provider] of this.providerInstances.entries()) {
        if (provider.serviceType !== serviceType) continue;

        const metrics = this.metricsMap.get(configId);
        const config = await this.prisma.aiModelConfig.findUnique({
          where: { id: configId },
        });

        if (!metrics || !config) continue;

        const score = this.calculateScore(metrics, config);
        candidates.push({ provider, metrics, config, score });
      }
    }

    if (candidates.length === 0) {
      throw new ServiceUnavailableException(
        `当前没有任何可用的 ${serviceType} 服务`,
      );
    }

    // 按评分排序，选择最高分的
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates[0];

    this.logger.log(
      `智能选择 ${serviceType} 服务：${selected.provider.name}（评分: ${selected.score.toFixed(2)}）`,
    );

    return selected.provider as T;
  }

  /**
   * 获取指定类型的所有可用 Provider 配置
   */
  async getAvailableProviders(serviceType: string) {
    const configs = await this.prisma.aiModelConfig.findMany({
      where: {
        type: serviceType,
        enabled: true,
      },
      orderBy: {
        priority: 'desc',
      },
      select: {
        id: true,
        name: true,
        provider: true,
        type: true,
        modelId: true,
        description: true,
        priority: true,
      },
    });

    return configs;
  }

  /**
   * 重新加载 Provider 配置（用于配置更新后）
   */
  async reloadProviders() {
    this.logger.log('正在重新加载 AI 服务配置...');
    await this.loadProviders();
    return {
      success: true,
      count: this.providerInstances.size,
    };
  }

  /**
   * 获取所有 Provider 的性能指标
   */
  getMetrics(serviceType?: string) {
    const allMetrics = Array.from(this.metricsMap.values());

    if (serviceType) {
      return allMetrics.filter((m) => m.serviceType === serviceType);
    }

    return allMetrics;
  }

  /**
   * 获取单个 Provider 的性能指标
   */
  getProviderMetrics(configId: number): ProviderMetrics | undefined {
    return this.metricsMap.get(configId);
  }

  /**
   * 监听数据库配置变化，重新加载配置
   */
  @OnEvent(AI_MODEL_CONFIG_CHANGED)
  async handleConfigChanged(payload: AiModelConfigChangedPayload) {
    this.logger.log(
      `收到配置变更事件：action=${payload.action}, type=${payload.type}, configId=${payload.configId}，开始 reloadProviders...`,
    );

    await this.reloadProviders();
  }

  /**
   * 获取文本生成 Provider
   */
  getTextGenProvider(
    configId?: number,
    providerType?: string,
  ): TextGenProvider {
    if (configId) {
      return this.getProviderById<TextGenProvider>(configId);
    } else if (providerType) {
      return this.getProviderByType<TextGenProvider>('text-gen', providerType);
    } else {
      throw new NotFoundException('必须指定 configId 或 providerType');
    }
  }

  /**
   * 自动选择文本生成 Provider
   */
  async selectTextGenProvider(): Promise<TextGenProvider> {
    return this.selectProvider<TextGenProvider>('text-gen');
  }

  /**
   * 获取图像生成 Provider
   */
  getImageGenProvider(
    configId?: number,
    providerType?: string,
  ): ImageGenProvider {
    if (configId) {
      return this.getProviderById<ImageGenProvider>(configId);
    } else if (providerType) {
      return this.getProviderByType<ImageGenProvider>(
        'image-gen',
        providerType,
      );
    } else {
      throw new NotFoundException('必须指定 configId 或 providerType');
    }
  }

  /**
   * 自动选择图像生成 Provider
   */
  async selectImageGenProvider(): Promise<ImageGenProvider> {
    return this.selectProvider<ImageGenProvider>('image-gen');
  }

  /**
   * 根据配置ID验证 Provider 配置
   * 用于测试 API Key 等配置是否有效
   */
  async validateProviderById(configId: number): Promise<boolean> {
    // 首先尝试从已加载的 provider 中获取
    let provider = this.providerInstances.get(configId);

    // 如果没有找到（可能是未启用的配置），则从数据库加载并临时创建
    if (!provider) {
      const config = await this.prisma.aiModelConfig.findUnique({
        where: { id: configId },
      });

      if (!config) {
        throw new NotFoundException(`未找到ID为 ${configId} 的配置`);
      }

      provider = this.createProvider(config);
      if (!provider) {
        throw new NotFoundException(
          `不支持的Provider类型：${config.type}/${config.provider}`,
        );
      }
    }

    try {
      const isValid = await provider.validateConfig();
      this.logger.log(
        `配置验证${isValid ? '成功' : '失败'}：${provider.name} (ID: ${configId})`,
      );
      return isValid;
    } catch (error) {
      this.logger.error(`配置验证出错 (ID: ${configId})`, error as any);
      throw error;
    }
  }
}
