import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { TextGenProvider, ChatMessage } from '../base.provider';

export class OpenAITextGenProvider extends TextGenProvider {
  private readonly logger = new Logger(OpenAITextGenProvider.name);
  readonly providerType = 'openai';

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async validateConfig(): Promise<boolean> {
    try {
      // 简单校验：检查必要字段
      return !!(this.config.baseUrl && this.config.apiKey);
    } catch (error) {
      this.logger.error('配置校验失败', error);
      return false;
    }
  }

  /**
   * OpenAI 流式调用
   */
  async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    const model = this.config.modelId || 'gpt-4o-mini';

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.config.baseUrl}/v1/chat/completions`,
        {
          model,
          messages,
          temperature: 0.7,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 300000,
          responseType: 'stream',
        },
      ),
    );

    return new Promise<void>((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // skip
          }
        }
      });

      response.data.on('end', () => resolve());
      response.data.on('error', (err: Error) => reject(err));
    });
  }
}
