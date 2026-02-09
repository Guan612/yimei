/**
 * AI模型配置（从数据库读取）
 */
export interface AiModelConfig {
  id: number;
  name: string;
  provider: string; // stability, openai, gemini, aliyun
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
 * 图像生成Provider抽象基类
 * 所有AI图像生成服务提供商必须实现此接口
 */
export abstract class BaseImageProvider {
  /**
   * Provider类型名称（如 'stability', 'openai', 'gemini', 'aliyun'）
   */
  abstract readonly providerType: string;

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
   * 获取Provider唯一标识（provider-configId）
   */
  get name(): string {
    return `${this.providerType}-${this.configId}`;
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
   * 文生图：根据文字描述生成图片
   * @param prompt - 图片描述文字
   * @param options - 生成参数（尺寸、风格等）
   * @returns 生成的图片URL或Base64
   */
  abstract generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult>;

  /**
   * 图生图修复（Inpainting）：根据遮罩修改图片局部区域
   * @param imageUrl - 原始图片URL
   * @param maskUrl - 遮罩图片URL（黑色=保留，白色=修改）
   * @param prompt - 修改描述
   * @param options - 生成参数
   * @returns 修改后的图片URL或Base64
   */
  abstract inpaint(
    imageUrl: string,
    maskUrl: string,
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult>;

  /**
   * 检查Provider配置是否有效
   */
  abstract validateConfig(): Promise<boolean>;
}

/**
 * 图像生成通用参数
 */
export interface ImageGenerationOptions {
  width?: number; // 图片宽度
  height?: number; // 图片高度
  aspectRatio?: string; // 宽高比 (如 '16:9', '1:1')
  negativePrompt?: string; // 负面提示词
  style?: string; // 风格预设
  steps?: number; // 生成步数（影响质量）
  cfgScale?: number; // CFG比例（提示词遵循度）
  seed?: number; // 随机种子
  samples?: number; // 生成数量
  model?: string; // 使用的具体模型
  referenceImageUrl?: string; // 参考图片URL，用于图生图
  referenceImageBase64?: string; // 参考图片Base64数据
  referenceImageMimeType?: string; // 参考图片MIME类型
}

/**
 * 图像生成结果
 */
export interface ImageGenerationResult {
  success: boolean; // 是否成功
  imageUrl?: string; // 图片URL（如果服务返回URL）
  imageBase64?: string; // 图片Base64（如果服务返回Base64）
  provider: string; // 使用的Provider名称
  configId: number; // 使用的配置ID
  model?: string; // 使用的具体模型
  cost?: number; // 生成成本（可选）
  metadata?: Record<string, unknown>; // 其他元数据
  error?: string; // 错误信息（如果失败）
}
