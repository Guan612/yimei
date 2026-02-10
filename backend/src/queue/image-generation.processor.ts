import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from './constants';
import { ImageGenerationJobData, ImageGenerationJobResult } from './interfaces';
import { ImageGenService } from '../image-gen/image-gen.service';

@Processor(QUEUE_NAMES.IMAGE_GENERATION)
export class ImageGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageGenerationProcessor.name);

  constructor(private readonly imageGenService: ImageGenService) {
    super();
  }

  async process(job: Job<ImageGenerationJobData>): Promise<ImageGenerationJobResult> {
    this.logger.log(`开始处理图片生成任务 ${job.id}, 类型: ${job.data.type}`);

    try {
      // 更新进度为 10%
      await job.updateProgress(10);

      let result;
      if (job.data.type === 'generate') {
        // 调用内部方法生成图片
        result = await this.imageGenService.generateImageInternal(
          job.data.dto as any,
          job.data.userId,
          async (progress: number) => {
            await job.updateProgress(progress);
          },
        );
      } else if (job.data.type === 'inpaint') {
        // 调用内部方法进行 inpaint
        result = await this.imageGenService.inpaintInternal(
          job.data.dto as any,
          job.data.userId,
          async (progress: number) => {
            await job.updateProgress(progress);
          },
        );
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
      this.logger.error(`任务 ${job.id} 处理失败: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message || '图片生成失败',
      };
    }
  }
}
