import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ImageGenProvider,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../base.provider';

/**
 * Stability AI Provider
 * 文档: https://platform.stability.ai/docs/api-reference
 */
export class StabilityImageGenProvider extends ImageGenProvider {
  readonly providerType = 'stability';
  private readonly logger = new Logger(StabilityImageGenProvider.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    if (!this.config || !this.config.apiKey) {
      this.logger.warn('Stability AI API key not configured');
      return false;
    }

    try {
      // 测试API连接
      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}/v1/user/account`, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error(
        `Stability AI validation failed for config ${this.configId}:`,
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
        `Generating image with Stability AI (config ${this.configId}): ${prompt}`,
      );

      // 使用配置中的modelId或用户指定的model
      const model =
        options?.model || this.config.modelId || 'stable-diffusion-xl-1024-v1-0';
      const endpoint = `${this.config.baseUrl}/v1/generation/${model}/text-to-image`;

      // 构建请求体
      const requestBody = {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: options?.cfgScale || 7,
        height: options?.height || 1024,
        width: options?.width || 1024,
        samples: options?.samples || 1,
        steps: options?.steps || 30,
        ...(options?.seed && { seed: options.seed }),
        ...(options?.negativePrompt && {
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: options.negativePrompt, weight: -1 },
          ],
        }),
      };

      const response = await firstValueFrom(
        this.httpService.post(endpoint, requestBody, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 60000, // 60秒超时
        }),
      );

      // Stability AI 返回 Base64 图片
      const artifacts = response.data.artifacts;
      if (!artifacts || artifacts.length === 0) {
        throw new Error('No image generated');
      }

      const imageBase64 = artifacts[0].base64;

      return {
        success: true,
        imageBase64,
        provider: this.providerType,
        configId: this.configId,
        model,
        metadata: {
          seed: artifacts[0].seed,
          finishReason: artifacts[0].finishReason,
        },
      };
    } catch (error) {
      this.logger.error('Stability AI generation failed:', error);
      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error: error.response?.data?.message || error.message,
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
        `Inpainting with Stability AI (config ${this.configId}): ${prompt}`,
      );

      const model =
        options?.model || this.config.modelId || 'stable-diffusion-xl-1024-v1-0';
      const endpoint = `${this.config.baseUrl}/v1/generation/${model}/image-to-image/masking`;

      // 下载图片和遮罩
      const [imageBuffer, maskBuffer] = await Promise.all([
        this.downloadImage(imageUrl),
        this.downloadImage(maskUrl),
      ]);

      // 构建 multipart/form-data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('init_image', imageBuffer, 'image.png');
      formData.append('mask_image', maskBuffer, 'mask.png');
      formData.append('text_prompts[0][text]', prompt);
      formData.append('text_prompts[0][weight]', '1');
      formData.append('cfg_scale', options?.cfgScale?.toString() || '7');
      formData.append('samples', '1');
      formData.append('steps', options?.steps?.toString() || '30');

      if (options?.negativePrompt) {
        formData.append('text_prompts[1][text]', options.negativePrompt);
        formData.append('text_prompts[1][weight]', '-1');
      }

      const response = await firstValueFrom(
        this.httpService.post(endpoint, formData, {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }),
      );

      const artifacts = response.data.artifacts;
      if (!artifacts || artifacts.length === 0) {
        throw new Error('No image generated');
      }

      return {
        success: true,
        imageBase64: artifacts[0].base64,
        provider: this.providerType,
        configId: this.configId,
        model,
        metadata: {
          seed: artifacts[0].seed,
          finishReason: artifacts[0].finishReason,
        },
      };
    } catch (error) {
      this.logger.error('Stability AI inpainting failed:', error);
      return {
        success: false,
        provider: this.providerType,
        configId: this.configId,
        error: error.response?.data?.message || error.message,
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
