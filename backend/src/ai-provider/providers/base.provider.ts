import { Response } from 'express';

/**
 * AI模型配置（从数据库读取）
 */
export interface AiModelConfig {
  id: number;
  name: string;
  provider: string; // openai, gemini, stability, aliyun
  type: string; // image-gen, text-gen, embedding
  modelId?: string | null;
  baseUrl: string;
  apiKey: string;
  config?: any;
  enabled: boolean;
  priority: number;
  description?: string | null;
}

/**
 * Provider 基类
 * 所有 AI Provider 必须继承此类
 */
export abstract class BaseProvider {
  /**
   * Provider类型名称（如 'openai', 'gemini', 'stability'）
   */
  abstract readonly providerType: string;

  /**
   * Provider服务类型（如 'text-gen', 'image-gen'）
   */
  abstract readonly serviceType: string;

  /**
   * 配置信息（从数据库加载）
   */
  protected config: AiModelConfig;

  /**
   * 配置ID（用于标识具体的配置实例）
   */
  get configId(): number {
    return this.config?.id;
  }

  /**
   * 获取Provider唯一标识（serviceType-provider-configId）
   */
  get name(): string {
    return `${this.serviceType}-${this.providerType}-${this.configId}`;
  }

  /**
   * 设置配置
   */
  setConfig(config: AiModelConfig) {
    this.config = config;
  }

  /**
   * 获取配置
   */
  getConfig(): AiModelConfig {
    return this.config;
  }

  /**
   * 检查Provider配置是否有效
   */
  abstract validateConfig(): Promise<boolean>;
}

/**
 * 文本生成 Provider 接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
}

export abstract class TextGenProvider extends BaseProvider {
  readonly serviceType = 'text-gen';

  /**
   * 流式生成文本
   */
  abstract streamChat(
    messages: ChatMessage[],
    res: Response,
  ): Promise<void>;
}

/**
 * 图像生成 Provider 接口
 */
export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  aspectRatio?: string;
  negativePrompt?: string;
  style?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  samples?: number;
  model?: string;
  referenceImageUrl?: string;
  referenceImageBase64?: string;
  referenceImageMimeType?: string;
  // Gemini 图片分辨率 (必须大写K)
  imageSize?: '1K' | '2K' | '4K';
  // OpenAI 质量参数
  // GPT image models: 'auto' | 'high' | 'medium' | 'low'
  // DALL-E 3: 'hd' | 'standard'
  quality?: 'auto' | 'high' | 'medium' | 'low' | 'hd' | 'standard';
  // OpenAI GPT image models 输出格式
  outputFormat?: 'png' | 'jpeg' | 'webp';
  // OpenAI GPT image models 压缩级别 (0-100)
  outputCompression?: number;
  // OpenAI GPT image models 背景透明度
  background?: 'transparent' | 'opaque' | 'auto';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  provider: string;
  configId: number;
  model?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export abstract class ImageGenProvider extends BaseProvider {
  readonly serviceType = 'image-gen';

  /**
   * 文生图：根据文字描述生成图片
   */
  abstract generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult>;

  /**
   * 图生图修复（Inpainting）：根据遮罩修改图片局部区域
   */
  abstract inpaint(
    imageUrl: string,
    maskUrl: string,
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult>;
}
