import { GenerateImageDto, InpaintImageDto } from '../image-gen/dto/generate-image.dto';

/**
 * 图片生成任务数据
 */
export interface ImageGenerationJobData {
  type: 'generate' | 'inpaint';
  userId: number;
  dto: GenerateImageDto | InpaintImageDto;
}

/**
 * 任务结果
 */
export interface ImageGenerationJobResult {
  success: boolean;
  data?: {
    id: number;
    imageUrl: string;
    provider: string;
    configId: number;
    model: string;
    createdAt: Date;
  };
  error?: string;
}
