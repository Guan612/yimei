import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateImageDto, InpaintImageDto } from './dto/generate-image.dto';
import {
  BaseImageProvider,
  ImageGenerationResult,
  AiModelConfig,
} from './providers/base.provider';
import { UploadService } from '../upload/upload.service';
import { StabilityProvider } from './providers/stability.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AI_MODEL_CONFIG_CHANGED,
  AiModelConfigChangedPayload,
} from 'src/common/events';

@Injectable()
export class ImageGenService implements OnModuleInit {
  private readonly logger = new Logger(ImageGenService.name);
  private providerInstances: Map<number, BaseImageProvider> = new Map();

  // Provider 类型映射表
  private providerClassMap = new Map<
    string,
    new (httpService: HttpService) => BaseImageProvider
  >([
    ['stability', StabilityProvider],
    ['openai', OpenAIProvider],
    ['gemini', GeminiProvider],
  ]);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  private async resolveInjectedPrompts(ids?: number[]): Promise<string[]> {
    if (!ids || ids.length === 0) return [];

    const uniqueIds = Array.from(new Set(ids));
    const rows = await this.prisma.medicalAesthetics.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, prompt: true },
    });

    const byId = new Map(rows.map((r) => [r.id, r.prompt]));
    const missing = uniqueIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `promptInjectIds 包含不存在的ID: ${missing.join(', ')}`,
      );
    }

    return ids
      .map((id) => byId.get(id) ?? '')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  private buildInjectedPrompt(params: {
    basePrompt: string;
    injectedPrompts: string[];
    position?: 'prepend' | 'append';
  }): string {
    const basePrompt = (params.basePrompt ?? '').trim();
    const injectedText = (params.injectedPrompts ?? [])
      .map((p) => p.trim())
      .filter(Boolean)
      .join(', ');

    if (!injectedText) return basePrompt;
    if (!basePrompt) return injectedText;

    const position = params.position ?? 'prepend';
    return position === 'append'
      ? `${basePrompt}, ${injectedText}`
      : `${injectedText}, ${basePrompt}`;
  }

  async onModuleInit() {
    // 启动时加载所有启用的 Provider 配置
    await this.loadProviders();
  }

  /**
   * 从数据库加载所有启用的图像生成 Provider
   */
  async loadProviders() {
    this.logger.log('正在从数据库加载图像生成服务配置...');

    const configs = await this.prisma.aiModelConfig.findMany({
      where: {
        type: 'image-gen',
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
            `已加载服务：${config.provider}（ID: ${config.id}，名称: ${config.name}）`,
          );
        }
      } catch (error) {
        this.logger.error(
          `加载服务失败（ID: ${config.id}，类型: ${config.provider}）`,
          error as any,
        );
      }
    }

    this.logger.log(`已加载 ${this.providerInstances.size} 个图像生成服务配置`);
  }

  /**
   * 根据配置创建 Provider 实例
   */
  private createProvider(config: AiModelConfig): BaseImageProvider | null {
    const ProviderClass = this.providerClassMap.get(config.provider);

    if (!ProviderClass) {
      this.logger.warn(`未知的服务类型：${config.provider}`);
      return null;
    }

    const provider = new ProviderClass(this.httpService);
    provider.setConfig(config);
    return provider;
  }

  /**
   * 根据配置 ID 获取 Provider
   */
  private getProviderById(configId: number): BaseImageProvider {
    const provider = this.providerInstances.get(configId);
    if (!provider) {
      throw new NotFoundException(
        `未找到配置 ID 为 ${configId} 的图像生成服务，或该服务已被禁用`,
      );
    }
    return provider;
  }

  /**
   * 根据 provider 类型获取第一个可用的 Provider
   */
  private getProviderByType(providerType: string): BaseImageProvider {
    for (const provider of this.providerInstances.values()) {
      if (provider.providerType === providerType) {
        return provider;
      }
    }
    throw new NotFoundException(
      `当前没有可用的「${providerType}」图像生成服务`,
    );
  }

  /**
   * 自动选择可用的 Provider（按优先级）
   */
  private async selectProvider(): Promise<BaseImageProvider> {
    for (const provider of this.providerInstances.values()) {
      try {
        const isValid = await provider.validateConfig();
        if (isValid) {
          this.logger.log(`自动选择图像生成服务：${provider.name}`);
          return provider;
        }
      } catch (error) {
        this.logger.warn(
          `服务 ${provider.name} 校验失败：${(error as any)?.message || error}`,
        );
      }
    }

    throw new ServiceUnavailableException('当前没有任何可用的图像生成服务');
  }

  /**
   * 生成图片
   */
  async generateImage(dto: GenerateImageDto, userId: number) {
    this.logger.log(`开始为用户 ${userId} 生成图片`);

    // 选择 Provider
    let provider: BaseImageProvider;
    if (dto.configId) {
      provider = this.getProviderById(dto.configId);
    } else if (dto.provider && dto.provider !== 'auto') {
      provider = this.getProviderByType(dto.provider);
    } else {
      provider = await this.selectProvider();
    }

    const injectedPrompts = await this.resolveInjectedPrompts(dto.promptInjectIds);
    const finalPrompt = this.buildInjectedPrompt({
      basePrompt: dto.prompt,
      injectedPrompts,
      position: dto.promptInjectPosition,
    });

    // 调用 Provider 生成图片
    const result: ImageGenerationResult = await provider.generateImage(
      finalPrompt,
      {
        width: dto.width,
        height: dto.height,
        aspectRatio: dto.aspectRatio,
        negativePrompt: dto.negativePrompt,
        style: dto.style,
        steps: dto.steps,
        cfgScale: dto.cfgScale,
        seed: dto.seed,
        samples: dto.samples,
        model: dto.model,
        referenceImageUrl: dto.referenceImageUrl,
        referenceImageBase64: dto.referenceImageBase64,
        referenceImageMimeType: dto.referenceImageMimeType,
      },
    );

    if (!result.success) {
      throw new BadRequestException(result.error || '图片生成失败');
    }

    // 如果返回的是 Base64，需要上传到 S3
    let finalImageUrl = result.imageUrl;
    let fileId: number | undefined;

    if (result.imageBase64) {
      const buffer = Buffer.from(result.imageBase64, 'base64');
      const uploadResult = await this.uploadService.uploadBuffer(
        buffer,
        `generated/${Date.now()}.png`,
        'image/png',
        userId,
      );
      finalImageUrl = uploadResult.url;
      fileId = uploadResult.fileId;
    } else if (result.imageUrl) {
      // 如果是外部 URL，创建 File 记录
      const file = await this.prisma.file.create({
        data: {
          key: result.imageUrl,
          contentType: 'image/png',
          status: 'uploaded',
          userId,
        },
      });
      fileId = file.id;
    }

    if (!fileId) {
      throw new BadRequestException('图片文件创建或上传失败');
    }

    // 保存生成记录到数据库
    const imageGeneration = await this.prisma.imageGeneration.create({
      data: {
        userId,
        fileId,
        prompt: dto.prompt,
        negativePrompt: dto.negativePrompt,
        provider: result.provider,
        model: result.model,
        parameters: dto as any,
        metadata: {
          ...result.metadata,
          configId: result.configId,
          ...(injectedPrompts.length > 0
            ? {
                promptInjection: {
                  ids: dto.promptInjectIds,
                  position: dto.promptInjectPosition,
                  injectedPrompts,
                  finalPrompt,
                },
              }
            : {}),
        } as any,
        cost: result.cost,
        status: 'completed',
      },
      include: {
        file: true,
      },
    });

    return {
      id: imageGeneration.id,
      imageUrl: finalImageUrl,
      provider: result.provider,
      configId: result.configId,
      model: result.model,
      createdAt: imageGeneration.createdAt,
    };
  }

  /**
   * Inpainting - 局部修改图片
   */
  async inpaint(dto: InpaintImageDto, userId: number) {
    this.logger.log(`开始为用户 ${userId} 进行图片局部重绘`);

    // 获取原图和遮罩图的 URL
    const imageFile = await this.prisma.file.findUnique({
      where: { id: dto.imageId },
    });
    const maskFile = await this.prisma.file.findUnique({
      where: { id: dto.maskId },
    });

    if (!imageFile || !maskFile) {
      throw new NotFoundException('图片文件或遮罩文件不存在');
    }

    const imageUrlResult = await this.uploadService.getFileUrl(dto.imageId, userId);
    const maskUrlResult = await this.uploadService.getFileUrl(dto.maskId, userId);

    if (!imageUrlResult || !maskUrlResult) {
      throw new BadRequestException('获取文件访问地址失败');
    }

    const imageUrl = imageUrlResult.url;
    const maskUrl = maskUrlResult.url;

    // 选择 Provider
    let provider: BaseImageProvider;
    if (dto.configId) {
      provider = this.getProviderById(dto.configId);
    } else if (dto.provider && dto.provider !== 'auto') {
      provider = this.getProviderByType(dto.provider);
    } else {
      provider = await this.selectProvider();
    }

    const injectedPrompts = await this.resolveInjectedPrompts(dto.promptInjectIds);
    const finalPrompt = this.buildInjectedPrompt({
      basePrompt: dto.prompt,
      injectedPrompts,
      position: dto.promptInjectPosition,
    });

    // 调用 Provider 进行 Inpainting
    const result = await provider.inpaint(imageUrl, maskUrl, finalPrompt, {
      negativePrompt: dto.negativePrompt,
      steps: dto.steps,
      cfgScale: dto.cfgScale,
      seed: dto.seed,
    });

    if (!result.success) {
      throw new BadRequestException(result.error || '图片局部重绘失败');
    }

    // 保存结果（与 generateImage 类似）
    let finalImageUrl = result.imageUrl;
    let fileId: number | undefined;

    if (result.imageBase64) {
      const buffer = Buffer.from(result.imageBase64, 'base64');
      const uploadResult = await this.uploadService.uploadBuffer(
        buffer,
        `inpaint/${Date.now()}.png`,
        'image/png',
        userId,
      );
      finalImageUrl = uploadResult.url;
      fileId = uploadResult.fileId;
    } else if (result.imageUrl) {
      const file = await this.prisma.file.create({
        data: {
          key: result.imageUrl,
          contentType: 'image/png',
          status: 'uploaded',
          userId,
        },
      });
      fileId = file.id;
    }

    if (!fileId) {
      throw new BadRequestException('图片文件创建或上传失败');
    }

    // 保存生成记录
    const imageGeneration = await this.prisma.imageGeneration.create({
      data: {
        userId,
        fileId,
        prompt: dto.prompt,
        negativePrompt: dto.negativePrompt,
        provider: result.provider,
        model: result.model,
        parameters: dto as any,
        metadata: {
          ...result.metadata,
          configId: result.configId,
          ...(injectedPrompts.length > 0
            ? {
                promptInjection: {
                  ids: dto.promptInjectIds,
                  position: dto.promptInjectPosition,
                  injectedPrompts,
                  finalPrompt,
                },
              }
            : {}),
        } as any,
        cost: result.cost,
        status: 'completed',
        type: 'inpaint',
        sourceImageId: dto.imageId,
      },
      include: {
        file: true,
      },
    });

    return {
      id: imageGeneration.id,
      imageUrl: finalImageUrl,
      provider: result.provider,
      configId: result.configId,
      model: result.model,
      createdAt: imageGeneration.createdAt,
    };
  }

  /**
   * 获取用户的生成历史
   */
  async getUserGenerations(userId: number, limit = 20, offset = 0) {
    this.logger.log(
      `查询用户 ${userId} 的图片生成历史，limit=${limit}, offset=${offset}`,
    );

    const generations = await this.prisma.imageGeneration.findMany({
      where: { userId },
      include: {
        file: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    this.logger.log(`找到 ${generations.length} 条记录`);

    return generations;
  }

  /**
   * 获取单个生成记录详情
   */
  async getGenerationById(id: number, userId: number) {
    const generation = await this.prisma.imageGeneration.findFirst({
      where: { id, userId },
      include: {
        file: true,
      },
    });

    if (!generation) {
      throw new NotFoundException('未找到对应的生成记录');
    }

    return generation;
  }

  /**
   * 获取所有可用的 Provider 配置列表
   */
  async getAvailableProviders() {
    const configs = await this.prisma.aiModelConfig.findMany({
      where: {
        type: 'image-gen',
        enabled: true,
      },
      orderBy: {
        priority: 'desc',
      },
      select: {
        id: true,
        name: true,
        provider: true,
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
    this.logger.log('正在重新加载图像生成服务配置...');
    await this.loadProviders();
    return {
      success: true,
      count: this.providerInstances.size,
    };
  }

  //监听数据库变化，重新加载配置
  @OnEvent(AI_MODEL_CONFIG_CHANGED)
  async handleConfigChanged(payload: AiModelConfigChangedPayload) {
    // 只处理 image-gen 的配置变动
    if (payload.type && payload.type !== 'image-gen') return;

    this.logger.log(
      `收到配置变更事件：action=${payload.action}, configId=${payload.configId}，开始 reloadProviders...`,
    );

    await this.reloadProviders();
  }
}
