import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateImageDto, InpaintImageDto } from './dto/generate-image.dto';
import { UploadService } from '../upload/upload.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { ImageGenerationResult } from '../ai-provider/providers/base.provider';

@Injectable()
export class ImageGenService {
  private readonly logger = new Logger(ImageGenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly aiProviderService: AiProviderService,
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
   * 生成图片
   */
  async generateImage(dto: GenerateImageDto, userId: number) {
    this.logger.log(`开始为用户 ${userId} 生成图片`);

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
    return this.aiProviderService.getAvailableProviders('image-gen');
  }

  /**
   * 重新加载 Provider 配置（用于配置更新后）
   */
  async reloadProviders() {
    this.logger.log('正在重新加载图像生成服务配置...');
    return this.aiProviderService.reloadProviders();
  }
}
