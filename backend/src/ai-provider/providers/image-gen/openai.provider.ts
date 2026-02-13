import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ImageGenProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../base.provider';

/**
 * OpenAI DALL-E Provider
 * 文档: https://platform.openai.com/docs/api-reference/images
 */
export class OpenAIImageGenProvider extends ImageGenProvider {
  readonly providerType = 'openai';
  private readonly logger = new Logger(OpenAIImageGenProvider.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config || !this.config.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return false;
    }

    try {
      // 测试API连接
      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `OpenAI validation failed for config ${this.configId}:`,
        error.message,
      );
      return false;
    }
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    try {
      this.logger.log(
        `Generating image with OpenAI DALL-E (config ${this.configId}): ${prompt}`,
      );

      // DALL-E 3 或 DALL-E 2
      const model = options?.model || this.config.modelId || 'dall-e-3';

      // DALL-E 3 支持的尺寸: 1024x1024, 1024x1792, 1792x1024
      // DALL-E 2 支持的尺寸: 256x256, 512x512, 1024x1024
      // GPT image models 支持的尺寸: 1024x1024, 1536x1024, 1024x1536, auto
      let size = '1024x1024';
      if (options?.width && options?.height) {
        size = `${options.width}x${options.height}`;
      } else if (options?.aspectRatio) {
        const aspectRatioMap = {
          '1:1': '1024x1024',
          '16:9': '1792x1024',
          '9:16': '1024x1792',
        };
        size = aspectRatioMap[options.aspectRatio] || '1024x1024';
      }

      const requestBody: any = {
        model,
        prompt,
        n: options?.samples || 1,
        size,
        response_format: 'url', // 或 'b64_json'
      };

      // 检测是否为 GPT image models
      const isGPTImageModel = model.startsWith('gpt-image');

      // GPT image models 特有参数
      if (isGPTImageModel) {
        // 质量参数 (auto, high, medium, low)
        if (options?.quality) {
          requestBody.quality = options.quality;
        }
        // 输出格式 (png, jpeg, webp)
        if (options?.outputFormat) {
          requestBody.output_format = options.outputFormat;
        }
        // 压缩级别 (0-100)
        if (options?.outputCompression !== undefined) {
          requestBody.output_compression = options.outputCompression;
        }
        // 背景透明度 (transparent, opaque, auto)
        if (options?.background) {
          requestBody.background = options.background;
        }
        // 风格 (如果没有通过 style 传递)
        if (options?.style) {
          requestBody.style = options.style;
        }
      }

      // DALL-E 3 特有参数
      if (model === 'dall-e-3') {
        // 质量参数 (hd, standard)
        requestBody.quality = options?.quality || 'standard';
        // 风格参数 (vivid, natural)
        requestBody.style = options?.style || 'vivid';
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/images/generations`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          },
        ),
      );

      const imageData = response.data.data[0];
      const imageUrl = imageData.url;

      // 注意: OpenAI返回的URL有过期时间，建议立即下载保存
      return {
        success: true,
        imageUrl,
        provider: this.providerType,
        configId: this.configId,
        model,
        metadata: {
          revisedPrompt: imageData.revised_prompt, // DALL-E 3会修改prompt
        },
      };
    } catch (error) {
      this.logger.error('OpenAI generation failed:', error);
      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async inpaint(
    imageUrl: string,
    maskUrl: string,
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    try {
      this.logger.log(
        `Inpainting with OpenAI DALL-E (config ${this.configId}): ${prompt}`,
      );

      // DALL-E 2 支持编辑功能，DALL-E 3 不支持
      // 下载图片和遮罩
      const [imageBuffer, maskBuffer] = await Promise.all([
        this.downloadImage(imageUrl),
        this.downloadImage(maskUrl),
      ]);

      // 确定输出尺寸
      let size = '1024x1024';
      if (options?.width && options?.height) {
        size = `${options.width}x${options.height}`;
      } else if (options?.aspectRatio) {
        const aspectRatioMap = {
          '1:1': '1024x1024',
          '16:9': '512x512', // DALL-E 2 编辑最大支持 512x512
          '9:16': '512x512',
        };
        size = aspectRatioMap[options.aspectRatio] || '1024x1024';
      }

      // 构建 multipart/form-data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('image', imageBuffer, 'image.png');
      formData.append('mask', maskBuffer, 'mask.png');
      formData.append('prompt', prompt);
      formData.append('n', '1');
      formData.append('size', size);
      formData.append('response_format', 'url');

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/images/edits`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              ...formData.getHeaders(),
            },
            timeout: 60000,
          },
        ),
      );

      const imageData = response.data.data[0];

      return {
        success: true,
        imageUrl: imageData.url,
        provider: this.providerType,
        configId: this.configId,
        model: 'dall-e-2', // 编辑功能只支持DALL-E 2
      };
    } catch (error) {
      this.logger.error('OpenAI inpainting failed:', error);
      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * 下载图片为Buffer
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      }),
    );
    return Buffer.from(response.data);
  }
}
