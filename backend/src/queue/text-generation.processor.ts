import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from './constants';
import { TextGenerationJobData, TextGenerationJobResult } from './interfaces';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { Writable } from 'stream';

@Processor(QUEUE_NAMES.TEXT_GENERATION)
export class TextGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(TextGenerationProcessor.name);

  constructor(private readonly aiProviderService: AiProviderService) {
    super();
  }

  async process(job: Job<TextGenerationJobData>) {
    this.logger.log(`开始处理文本生成任务 ${job.id}, 类型: ${job.data.type}`);

    try {
      // 更新进度为 10%
      await job.updateProgress(10);

      let result: TextGenerationJobResult['data'];
      if (job.data.type === 'chat') {
        result = await this.processChatInternal(job);
      } else if (job.data.type === 'completion') {
        result = await this.processCompletionInternal(job);
      } else {
        throw new Error(`未知的任务类型: ${job.data.type}`);
      }

      // 完成，进度 100%
      await job.updateProgress(100);

      this.logger.log(`任务 ${job.id} 处理完成`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `任务 ${job.id} 处理失败: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || '文本生成失败',
      };
    }
  }

  /**
   * 处理聊天类型任务
   */
  private async processChatInternal(
    job: Job<TextGenerationJobData>,
  ): Promise<TextGenerationJobResult['data']> {
    const { messages, configId } = job.data;

    // 获取 text-gen provider
    const provider = configId
      ? this.aiProviderService.getProviderById(configId)
      : await this.aiProviderService.selectTextGenProvider();

    this.logger.log(
      `任务 ${job.id} 使用配置：${provider.name}`,
    );

    // 更新进度为 30%
    await job.updateProgress(30);

    // 创建一个模拟的 Response 对象来收集流式响应
    const responseData = await this.collectStreamResponse(
      provider,
      messages,
      async (progress: number) => {
        await job.updateProgress(30 + progress * 0.6); // 30% - 90%
      },
    );

    // 更新进度为 90%
    await job.updateProgress(90);

    return {
      message: responseData,
      provider: provider.providerType,
      configId: provider.configId,
      model: provider.getConfig().modelId || undefined,
      createdAt: new Date(),
    };
  }

  /**
   * 处理文本补全类型任务（暂未实现）
   */
  private async processCompletionInternal(
    _job: Job<TextGenerationJobData>,
  ): Promise<TextGenerationJobResult['data']> {
    throw new Error('文本补全功能暂未实现');
  }

  /**
   * 收集流式响应为完整文本
   */
  private async collectStreamResponse(
    provider: any,
    messages: any[],
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let fullResponse = '';
      let chunkCount = 0;

      // 创建一个可写流来模拟 Response 对象
      const mockResponse = new Writable({
        write(chunk: any, _encoding: any, callback: any) {
          const data = chunk.toString();

          // 解析 SSE 数据
          const lines = data.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const jsonData = trimmed.slice(6);
            if (jsonData === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonData);
              if (parsed.content) {
                fullResponse += parsed.content;
                chunkCount++;

                // 每10个chunk更新一次进度
                if (chunkCount % 10 === 0 && onProgress) {
                  const progress = Math.min(chunkCount / 100, 0.9);
                  onProgress(progress).catch(() => {});
                }
              }
            } catch {
              // skip
            }
          }

          callback();
        },
      }) as any;

      // 添加 Response 对象需要的方法
      mockResponse.setHeader = () => {};
      mockResponse.flushHeaders = () => {};
      mockResponse.write = function(data: any) {
        return Writable.prototype.write.call(this, data);
      };
      mockResponse.end = () => {
        resolve(fullResponse);
      };

      // 调用流式方法
      provider
        .streamChat(messages, mockResponse)
        .then(() => {
          if (onProgress) {
            onProgress(1).catch(() => {});
          }
          mockResponse.end();
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  }
}
