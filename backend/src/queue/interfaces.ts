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

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | any[];  // 支持文本或多模态内容
}

/**
 * 文本生成任务数据
 */
export interface TextGenerationJobData {
  type: 'chat' | 'completion';
  userId: number;
  messages: ChatMessage[];  // 消息列表，支持动态注入系统提示词
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;  // 是否流式返回
  configId?: number;  // 指定配置 ID
}

/**
 * 文本生成任务结果
 */
export interface TextGenerationJobResult {
  success: boolean;
  data?: {
    message: string;
    provider: string;
    configId: number;
    model?: string;
    createdAt: Date;
  };
  error?: string;
}
