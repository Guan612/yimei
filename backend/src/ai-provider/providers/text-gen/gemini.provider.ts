import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { TextGenProvider, ChatMessage } from '../base.provider';

export class GeminiTextGenProvider extends TextGenProvider {
  private readonly logger = new Logger(GeminiTextGenProvider.name);
  readonly providerType = 'gemini';

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
   * Gemini 流式调用
   */
  async streamChat(messages: ChatMessage[], res: Response): Promise<void> {
    const model = this.config.modelId || 'gemini-2.5-flash-preview';

    // 转换消息格式为 Gemini 格式
    const systemInstruction =
      messages.find((m) => m.role === 'system')?.content || '';
    const contents: any[] = [];

    for (const m of messages.filter((m) => m.role !== 'system')) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url' && part.image_url?.url) {
            try {
              this.logger.log(`正在下载图片: ${part.image_url.url}`);
              const imgResponse = await firstValueFrom(
                this.httpService.get(part.image_url.url, {
                  responseType: 'arraybuffer',
                  timeout: 300000,
                }),
              );
              const buffer = Buffer.from(imgResponse.data);
              const base64 = buffer.toString('base64');
              const contentType =
                imgResponse.headers['content-type'] || 'image/jpeg';
              parts.push({
                inline_data: { mime_type: contentType, data: base64 },
              });
              this.logger.log(`图片下载成功，大小: ${buffer.length} bytes, 类型: ${contentType}`);
            } catch (err) {
              this.logger.error(`下载图片失败: ${part.image_url.url}`, err);
              // 抛出错误而不是静默跳过
              throw new Error(`无法下载图片: ${err.message || err}`);
            }
          }
        }
      } else {
        parts.push({ text: m.content as string });
      }

      contents.push({ role, parts });
    }

    // 如果有 system prompt，放到第一条 user 消息前面
    if (systemInstruction && contents.length > 0 && contents[0].role === 'user') {
      contents[0].parts[0].text = `${systemInstruction}\n\n${contents[0].parts[0].text}`;
    }

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.config.baseUrl}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`,
        {
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        },
        {
          headers: {
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

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
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
