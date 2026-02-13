import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ImageGenProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../base.provider';

/**
 * Google Gemini 2.5 Flash Image Generation Provider
 * 文档: https://ai.google.dev/gemini-api/docs/image-generation?hl=zh-cn
 */
export class GeminiImageGenProvider extends ImageGenProvider {
  readonly providerType = 'gemini';
  private readonly logger = new Logger(GeminiImageGenProvider.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config || !this.config.apiKey) {
      this.logger.warn('Gemini API key not configured');
      return false;
    }

    // 如果配置中设置了跳过验证，直接返回 true
    if (this.config.config?.skipValidation) {
      this.logger.log(
        `Skipping validation for config ${this.configId} (skipValidation enabled)`,
      );
      return true;
    }

    try {
      // 测试API连接 - 列出可用模型
      // 注意：第三方代理可能不支持此端点，可以在配置中设置 skipValidation: true
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.config.baseUrl}/models?key=${this.config.apiKey}`,
          {
            timeout: 5000,
          },
        ),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Gemini validation failed for config ${this.configId}:`,
        error.message,
      );
      this.logger.warn(
        `If using a third-party proxy, consider adding "skipValidation": true to the config field`,
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
        `Generating image with Gemini 2.5 Flash (config ${this.configId}): ${prompt}`,
      );

      // 默认使用 Gemini 2.5 Flash Image Preview 模型
      const model =
        options?.model ||
        this.config.modelId ||
        'gemini-2.5-flash-image-preview';

      // 构建请求体，按照 generateContent API 格式
      const parts: any[] = [
        {
          text: prompt,
        },
      ];

      // 如果有参考图片，优先使用 base64 数据，否则尝试下载 URL
      if (options?.referenceImageBase64) {
        this.logger.log('检测到参考图片(base64)，将作为 inline_data 传入 Gemini API');
        parts.push({
          inline_data: {
            mime_type: options.referenceImageMimeType || 'image/jpeg',
            data: options.referenceImageBase64,
          },
        });
      } else if (options?.referenceImageUrl) {
        this.logger.log('检测到参考图片(URL)，将下载并作为 inline_data 传入 Gemini API');
        const imageBuffer = await this.downloadImage(options.referenceImageUrl);
        const imageBase64 = imageBuffer.toString('base64');
        const imageMimeType = this.getMimeType(options.referenceImageUrl);
        parts.push({
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64,
          },
        });
      }

      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      };

      // 设置图片配置（分辨率和宽高比）
      if (options?.imageSize || options?.aspectRatio) {
        requestBody.generationConfig.imageConfig = {};
        if (options.imageSize) {
          requestBody.generationConfig.imageConfig.imageSize = options.imageSize;
        }
        if (options.aspectRatio) {
          requestBody.generationConfig.imageConfig.aspectRatio = options.aspectRatio;
        }
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 300000,
          },
        ),
      );
      const candidates = response.data.candidates;
      if (!candidates || candidates.length === 0) {
        this.logger.error(
          'No candidates in response. Full response:',
          JSON.stringify(response.data, null, 2),
        );
        throw new Error('No image generated');
      }

      // 从 parts 中提取图片数据
      const responseParts = candidates[0].content?.parts;
      if (!responseParts || responseParts.length === 0) {
        throw new Error('No parts in response');
      }

      // 查找包含图片的 part
      const imagePart = responseParts.find((part: any) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        this.logger.error(
          'No image data in response. Parts:',
          JSON.stringify(responseParts, null, 2),
        );
        throw new Error('No image data in response');
      }

      const imageBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || 'image/png';

      return {
        success: true,
        imageBase64,
        provider: this.providerType,
        configId: this.configId,
        model,
        metadata: {
          mimeType,
        },
      };
    } catch (error) {
      this.logger.error('Gemini generation failed:', error);
      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error:
          error.response?.data?.error?.message ||
          error.message ||
          'Unknown error',
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
        `Inpainting with Gemini (config ${this.configId}): ${prompt}`,
      );

      // 使用 Gemini 图片编辑模型
      const model =
        options?.model ||
        this.config.modelId ||
        'gemini-3-pro-image-preview';

      // 下载原图（遮罩图在 Gemini 中不需要单独传递）
      const imageBuffer = await this.downloadImage(imageUrl);

      // 转换为 base64
      const imageBase64 = imageBuffer.toString('base64');

      // 获取图片的 MIME 类型
      const imageMimeType = this.getMimeType(imageUrl);

      // 构建请求体，使用 Gemini generateContent API 格式
      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      };

      // 设置图片配置（分辨率和宽高比）
      if (options?.imageSize || options?.aspectRatio) {
        requestBody.generationConfig.imageConfig = {};
        if (options.imageSize) {
          requestBody.generationConfig.imageConfig.imageSize = options.imageSize;
        }
        if (options.aspectRatio) {
          requestBody.generationConfig.imageConfig.aspectRatio = options.aspectRatio;
        }
      }

      this.logger.debug(
        'Gemini Inpaint API Request URL:',
        `${this.config.baseUrl}/v1beta/models/${model}:generateContent`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 300000,
          },
        ),
      );

      // 解析 Gemini 响应
      if (
        !response.data.candidates ||
        response.data.candidates.length === 0
      ) {
        this.logger.error(
          'No candidates in response:',
          JSON.stringify(response.data, null, 2),
        );
        throw new Error('No image generated by Gemini');
      }

      const candidate = response.data.candidates[0];
      const parts = candidate.content?.parts || [];

      this.logger.debug(`Found ${parts.length} parts in response`);

      // 查找图片部分 - 使用 inlineData (驼峰式)
      const imagePart = parts.find((part: any) => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        this.logger.error(
          'No image data in response. Parts structure:',
          JSON.stringify(parts, null, 2),
        );
        throw new Error('No image data in Gemini response');
      }

      const imageBase64Result = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || 'image/png';

      return {
        success: true,
        imageBase64: imageBase64Result,
        provider: this.providerType,
        configId: this.configId,
        model,
        metadata: {
          mimeType: mimeType,
          editMode: 'gemini-inpainting',
        },
      };
    } catch (error) {
      this.logger.error('Gemini inpainting failed:');
      this.logger.error(error);

      // 记录更详细的错误信息
      if (error.response?.data) {
        this.logger.error(
          'Gemini API Error Response:',
          JSON.stringify(error.response.data, null, 2),
        );
      }

      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error:
          error.response?.data?.error?.message ||
          error.message ||
          'Unknown error',
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
        timeout: 300000,
      }),
    );
    return Buffer.from(response.data);
  }

  /**
   * 根据 URL 获取 MIME 类型
   */
  private getMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/png';
  }
}
