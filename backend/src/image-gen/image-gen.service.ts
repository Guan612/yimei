import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateImageDto, InpaintImageDto } from './dto/generate-image.dto';
import { UploadService } from '../upload/upload.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { ImageGenerationResult } from '../ai-provider/providers/base.provider';
import { QUEUE_NAMES } from '../queue/constants';
import { ImageGenerationJobData } from '../queue/interfaces';

@Injectable()
export class ImageGenService {
  private readonly logger = new Logger(ImageGenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly aiProviderService: AiProviderService,
    @InjectQueue(QUEUE_NAMES.IMAGE_GENERATION)
    private readonly imageGenerationQueue: Queue<ImageGenerationJobData>,
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

  /**
   * 提交图片生成任务到队列（异步）
   */
  async generateImage(dto: GenerateImageDto, userId: number) {
    this.logger.log(`提交图片生成任务到队列，用户 ${userId}`);

    // 添加任务到队列
    const job = await this.imageGenerationQueue.add('generate-image', {
      type: 'generate',
      userId,
      dto,
    } as ImageGenerationJobData, {
      removeOnComplete: { age: 300, count: 100 },
      removeOnFail: false,
    });

    this.logger.log(`任务已提交，Job ID: ${job.id}`);

    return {
      jobId: String(job.id),
      message: '图片生成任务已提交，请使用 jobId 查询任务状态',
    };
  }

  /**
   * 生成图片的内部实现（供队列处理器调用）
   */
  async generateImageInternal(
    dto: GenerateImageDto,
    userId: number,
    progressCallback?: (progress: number) => Promise<void>,
  ) {
    this.logger.log(`开始为用户 ${userId} 生成图片`);

    // 进度：20% - 准备参数
    if (progressCallback) await progressCallback(20);

    // 使用统一的 AI Provider 服务选择 Provider
    const provider = dto.configId
      ? this.aiProviderService.getImageGenProvider(dto.configId)
      : dto.provider && dto.provider !== 'auto'
        ? this.aiProviderService.getImageGenProvider(undefined, dto.provider)
        : await this.aiProviderService.selectImageGenProvider();

    const injectedPrompts = await this.resolveInjectedPrompts(dto.promptInjectIds);
    const finalPrompt = this.buildInjectedPrompt({
      basePrompt: dto.prompt,
      injectedPrompts,
      position: dto.promptInjectPosition,
    });

    // 进度：30% - 开始生成图片
    if (progressCallback) await progressCallback(30);

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

    // 进度：70% - 图片生成完成
    if (progressCallback) await progressCallback(70);

    if (!result.success) {
      throw new BadRequestException(result.error || '图片生成失败');
    }

    // 进度：80% - 上传图片
    if (progressCallback) await progressCallback(80);

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

    // 进度：90% - 保存记录
    if (progressCallback) await progressCallback(90);

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
   * 提交图片局部修改任务到队列（异步）
   */
  async inpaint(dto: InpaintImageDto, userId: number) {
    this.logger.log(`提交图片局部重绘任务到队列，用户 ${userId}`);

    // 添加任务到队列
    const job = await this.imageGenerationQueue.add('inpaint-image', {
      type: 'inpaint',
      userId,
      dto,
    } as ImageGenerationJobData, {
      removeOnComplete: { age: 300, count: 100 },
      removeOnFail: false,
    });

    this.logger.log(`任务已提交，Job ID: ${job.id}`);

    return {
      jobId: String(job.id),
      message: '图片局部重绘任务已提交，请使用 jobId 查询任务状态',
    };
  }

  /**
   * Inpainting - 局部修改图片的内部实现（供队列处理器调用）
   */
  async inpaintInternal(
    dto: InpaintImageDto,
    userId: number,
    progressCallback?: (progress: number) => Promise<void>,
  ) {
    this.logger.log(`开始为用户 ${userId} 进行图片局部重绘`);

    // 进度：20% - 获取文件
    if (progressCallback) await progressCallback(20);

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

    // 进度：30% - 选择 Provider
    if (progressCallback) await progressCallback(30);

    // 使用统一的 AI Provider 服务选择 Provider
    const provider = dto.configId
      ? this.aiProviderService.getImageGenProvider(dto.configId)
      : dto.provider && dto.provider !== 'auto'
        ? this.aiProviderService.getImageGenProvider(undefined, dto.provider)
        : await this.aiProviderService.selectImageGenProvider();

    const injectedPrompts = await this.resolveInjectedPrompts(dto.promptInjectIds);
    const finalPrompt = this.buildInjectedPrompt({
      basePrompt: dto.prompt,
      injectedPrompts,
      position: dto.promptInjectPosition,
    });

    // 进度：40% - 开始 Inpainting
    if (progressCallback) await progressCallback(40);

    // 调用 Provider 进行 Inpainting
    const result = await provider.inpaint(imageUrl, maskUrl, finalPrompt, {
      negativePrompt: dto.negativePrompt,
      steps: dto.steps,
      cfgScale: dto.cfgScale,
      seed: dto.seed,
    });

    // 进度：70% - Inpainting 完成
    if (progressCallback) await progressCallback(70);

    if (!result.success) {
      throw new BadRequestException(result.error || '图片局部重绘失败');
    }

    // 进度：80% - 上传图片
    if (progressCallback) await progressCallback(80);

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

    // 进度：90% - 保存记录
    if (progressCallback) await progressCallback(90);

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
    return this.aiProviderService.getAvailableProviders('image-gen');
  }

  /**
   * 重新加载 Provider 配置（用于配置更新后）
   */
  async reloadProviders() {
    this.logger.log('正在重新加载图像生成服务配置...');
    return this.aiProviderService.reloadProviders();
  }

  /**
   * 获取任务状态
   */
  async getJobStatus(jobId: string) {
    const job = await this.imageGenerationQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`未找到任务 ${jobId}`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId: String(job.id),
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      result: state === 'completed' ? returnValue : null,
      error: state === 'failed' ? failedReason : null,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  }

  /**
   * 取消任务
   */
  async cancelJob(jobId: string) {
    const job = await this.imageGenerationQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`未找到任务 ${jobId}`);
    }

    const state = await job.getState();

    if (state === 'completed' || state === 'failed') {
      throw new BadRequestException(`任务已${state === 'completed' ? '完成' : '失败'}，无法取消`);
    }

    await job.remove();

    return {
      message: '任务已取消',
      jobId: String(job.id),
    };
  }
}
