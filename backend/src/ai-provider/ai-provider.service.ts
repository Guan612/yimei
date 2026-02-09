import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
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

    for (const config of configs) {
      try {
        const provider = this.createProvider(config);
        if (provider) {
          this.providerInstances.set(config.id, provider);
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
  getProviderById<T extends BaseProvider = BaseProvider>(
    configId: number,
  ): T {
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
   * 自动选择可用的 Provider（按优先级）
   */
  async selectProvider<T extends BaseProvider = BaseProvider>(
    serviceType: string,
  ): Promise<T> {
    for (const provider of this.providerInstances.values()) {
      if (provider.serviceType !== serviceType) continue;

      try {
        const isValid = await provider.validateConfig();
        if (isValid) {
          this.logger.log(`自动选择 ${serviceType} 服务：${provider.name}`);
          return provider as T;
        }
      } catch (error) {
        this.logger.warn(
          `服务 ${provider.name} 校验失败：${(error as any)?.message || error}`,
        );
      }
    }

    throw new ServiceUnavailableException(
      `当前没有任何可用的 ${serviceType} 服务`,
    );
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
  getTextGenProvider(configId?: number, providerType?: string): TextGenProvider {
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
  getImageGenProvider(configId?: number, providerType?: string): ImageGenProvider {
    if (configId) {
      return this.getProviderById<ImageGenProvider>(configId);
    } else if (providerType) {
      return this.getProviderByType<ImageGenProvider>('image-gen', providerType);
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
}
